// Imported from the package root, not `decap-cms-backend-gitlab/src/API`:
// jest's moduleNameMapper rewrites any path containing the package name to its
// index, so the deep path resolved to the index's (nonexistent) default export
// and `new API(...)` threw under test - which is why `authenticate` had no
// coverage here at all. See the same note in decap-cms-backend-turbo-github.
import { GitLabBackend, GitLabNotesAPI, API } from 'decap-cms-backend-gitlab';
import {
  APIError,
  unsentRequest,
  NotesPollingManager,
  type Config,
  type User,
  type Credentials,
  branchFromContentKey,
  collectionKeyForFiles,
  generateContentKey,
} from 'decap-cms-lib-util';
import { stripIndent } from 'common-tags';

import { SupabaseClient } from './supabase';
import SupabaseAuthenticationPage from './AuthenticationPage';
import { resolveCommitAuthorFromSupabaseUser } from './commitAuthor';
import { supabaseUserIdFromToken } from './noteIdentity';
import { coalesceKey, createRequestCoalescer, type RequestCoalescer } from './requestCoalescer';
import { recordCmsEvent } from './telemetry';
import { expiresAtOf, revokeSession, sessionIdOf, withRefreshLock } from './sessionSync';
import { EditorBridge, registerAskClaudeAction } from './editorBridge';
import {
  createProxyMeter,
  measurePayloadBytes,
  recordProxyResponse,
  type ProxyMeter,
} from './saveMetrics';

import type { EditorApi, RegisterFieldAction } from './editorBridge';

interface SupabaseUser extends User {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  /** Set when Turbo minted this session for this CMS alone; see `logout`. */
  dedicated_session?: boolean;
  user_name?: string;
  user_email?: string;
  email?: string;
  user_metadata?: {
    active_site_id?: string;
    display_name?: string;
    full_name?: string;
    name?: string;
    // Set by Supabase for OAuth sign-ins (Google spells it `picture`); absent
    // for email/password users, who fall back to the generic avatar icon.
    avatar_url?: string;
    picture?: string;
  };
}

type SupabaseRefreshError = Error & {
  status?: number;
  code?: string;
  isTerminal?: boolean;
};

// Fake GitLab user shape returned by currentUser/authenticate — this backend
// never has a real GitLab identity for the CMS user (see /gl/user's
// synthesized response on the server side, which this mirrors).
type GitLabUser = {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
};

const REFRESH_BUFFER_SECONDS = 300;
const REFRESH_RETRY_ATTEMPTS = 3;
/** How long to stop retrying after a refresh failed transiently. */
const REFRESH_COOLDOWN_MS = 30_000;
/**
 * GoTrue refresh-grant failures that mean the token is dead for good. Kept
 * alongside the status check so a code arriving under an unexpected status is
 * still recognised.
 */
const TERMINAL_REFRESH_CODES = new Set([
  'refresh_token_not_found',
  'refresh_token_already_used',
  'invalid_grant',
  'invalid_refresh_token',
  'session_not_found',
  'session_expired',
]);

const TURBO_SITE_ACCESS_DENIED_MESSAGE =
  "Your Decap Turbo account doesn't have access to this site. A team owner can add you " +
  "from the site's Members tab in Decap Turbo, then log in again.";

const SESSION_EXPIRED_MESSAGE = 'Session expired. Please log in again.';

/**
 * The proxy's own refusal of the access token (supabase/functions/gl/index.ts)
 * is this exact plain-text body. A 401 GitLab sent back through the proxy is
 * JSON ("401 Unauthorized") and is about the group token, not this session,
 * so it must not log the editor out.
 */
const PROXY_UNAUTHORIZED_BODY = 'Unauthorized';

/** The proxy's 403 for a user with no membership on this site. */
const SITE_ACCESS_DENIED_MARKER = 'no access to requested site';

function isProxyUrl(url: string) {
  return url.includes('/functions/v1/gl');
}

/**
 * The proxy writes the reason an editor should read into `error` — "this site
 * is read-only", "this entry's slug is too long" — while GitLab's own bodies
 * use `message`. Either way the toast should show
 * the sentence, not the JSON around it.
 */
function proxyErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.error === 'string') return parsed.error;
    if (typeof parsed?.message === 'string') return parsed.message;
  } catch {
    // Not JSON: the body is already the message.
  }
  return body;
}

/** Reads a response's body without consuming it for whoever parses it next. */
function peekBody(response: Response): Promise<string> {
  if (typeof response.clone !== 'function') return Promise.resolve('');
  return response
    .clone()
    .text()
    .catch(() => '');
}

/**
 * Makes a failed proxy response read as its `error` sentence wherever the
 * GitLab API client parses it. lib-util's parseResponse looks for `message`,
 * so a proxy refusal reached the editor as the JSON around the sentence, or
 * as the parsed object in place of a message. The GitHub twin does this in
 * handleRequestError, which the GitLab client does not have.
 */
function exposeProxyError(response: Response, body: string): Response {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(body);
  } catch {
    return response;
  }
  if (typeof parsed?.error !== 'string' || parsed.message) return response;
  const sentence = parsed.error;
  response.json = () => Promise.resolve({ ...parsed, message: sentence });
  response.text = () => Promise.resolve(sentence);
  return response;
}

/**
 * What an API request gets once the session is over, without reaching the
 * proxy. A response rather than a throw: lib-util's requestWithBackoff
 * retries any throw five times with growing pauses (~55 s in all), while a
 * 401 goes straight to the parser, which raises it as an APIError carrying
 * `message`.
 */
function sessionEndedResponse(message: string): Response {
  const response = {
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(message),
    clone: () => response,
  };
  return response as unknown as Response;
}

// See decap-cms-backend-turbo-github's implementation.tsx for the GitHub-flavored
// twin of this — same rationale: shared control-plane values are identical
// across every site, so a site's config.yml only needs `turbo_site_id`.
const DEFAULT_CONFIG_ENDPOINT = 'https://sb.decapcms.org/functions/v1/config';

export default class DecapTurboGitLabBackend extends GitLabBackend {
  static async preloadConfig(config: Config): Promise<Config> {
    const backend = config.backend as Record<string, unknown>;
    const isFullyManuallyConfigured = Boolean(backend.supabase_app_id && backend.supabase_anon_key);
    if (isFullyManuallyConfigured) {
      return config;
    }

    if (backend.supabase_app_id && !backend.supabase_anon_key) {
      throw new Error(
        "turbo-gitlab config error: 'supabase_app_id' is set without 'supabase_anon_key'. " +
          "Provide both to configure manually, or provide only 'turbo_site_id' to fetch " +
          'both from the control plane.',
      );
    }

    if (!backend.turbo_site_id) {
      return config;
    }

    const endpoint = (backend.turbo_config_url as string) || DEFAULT_CONFIG_ENDPOINT;
    const response = await fetch(
      `${endpoint}?site_id=${encodeURIComponent(backend.turbo_site_id as string)}`,
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        `Failed to load turbo-gitlab site defaults: ${body.error || response.status}`,
      );
    }

    const defaults = await response.json();
    // The config endpoint returns them as JSON strings; typing them here keeps
    // the spread below assignable to the backend config's `repo`/`branch`.
    const { repo, branch, ...otherDefaults } = defaults as Record<string, unknown> & {
      repo?: string;
      branch?: string;
    };

    return {
      ...config,
      backend: {
        ...otherDefaults,
        ...config.backend,
        // `repo` is authoritative from the sites row, not config.yml, while
        // `branch` comes from config.yml whenever it names one — see
        // decap-cms-backend-turbo-github's implementation.tsx for why.
        ...(repo ? { repo } : {}),
        ...(branch && !config.backend.branch ? { branch } : {}),
      },
    };
  }

  supabaseAccessToken: string | null = null;
  supabaseRefreshToken: string | null = null;
  supabaseExpiresAt: number | null = null;
  /**
   * Whether this CMS owns its Turbo session outright. "Login with Turbo" now
   * hands each CMS a session of its own, but logins from before that, or one
   * where Turbo could not mint one, still share the dashboard's session, and
   * those must never be revoked from here. See `logout`.
   */
  dedicatedSession = false;
  /**
   * The signed-in person, as opposed to the project being edited: email,
   * display name and (for OAuth sign-ins) avatar, straight off the Turbo
   * session. `currentUser` reports these to the header. Survives a reload
   * because `authenticate` returns the same fields on the stored user object,
   * which `restoreUser` hands straight back. Cleared by `logout`.
   */
  supabaseIdentity: SupabaseUser | null = null;
  supabaseAnonKey: string;
  supabaseId: string;
  siteId: string;
  commitAuthorEmailFallback?: string;
  updateUserCredentialsFn: (credentials: Credentials) => void;
  /** The stored user as another tab may have left it; see `adoptRotatedSession`. */
  retrieveUserCredentials: () => Credentials | null;
  // refreshedTokenPromise is already declared (and typed identically) on the
  // GitLabBackend base class — redeclaring it here would need TypeScript's
  // `declare` modifier, which this repo's Babel-based build doesn't support
  // (no allowDeclareFields), so it's intentionally omitted rather than
  // re-declared.
  reloadEntriesAfterPersist?: boolean;
  /** Epoch ms before which refreshSessionIfNeeded will not try again. */
  refreshBlockedUntil = 0;
  /** Core's hook for a session that has ended for good; see invalidateSession. */
  onSessionInvalid: (message: string) => void;
  /**
   * Set once this session is known to be over, and cleared by the next login.
   * While set, requests fail here without reaching the proxy.
   */
  sessionInvalidMessage: string | null = null;
  _currentUserPromise?: Promise<GitLabUser>;
  /**
   * Non-null only while a save is in flight. Every proxied response is folded
   * into it, so `cms_entry_saved` can report how many round trips that one save
   * cost and how much of the wait was GitLab's own time. Null the rest of the
   * time, so ordinary reads are not counted.
   */
  proxyMeter: ProxyMeter | null = null;

  /**
   * Joins concurrent identical reads. One per backend instance, so every read
   * path — the proxied GitLab API via `apiRequestFunction` and this backend's
   * own `glFetch` — shares a single view of what is already in flight.
   */
  protected coalesceRequest: RequestCoalescer = createRequestCoalescer();

  supabase: SupabaseClient;

  constructor(config: Config, options: any = {}) {
    super(config, options);

    // See decap-cms-backend-turbo-github's identical guard: GitLab also exposes a
    // separate GraphQL API/schema, and the same tenant-scoping-bypass risk
    // applies — a GraphQL transport here would bypass the x-site-id/site_id
    // scoping this backend adds on top of every REST request via
    // apiRequestFunction.
    if (this.useGraphQL) {
      throw new Error(
        "Decap Turbo GitLab backend does not support 'use_graphql: true' — GraphQL requests would bypass per-site tenant scoping. Remove use_graphql from your config.",
      );
    }

    this.supabaseAnonKey = (config.backend.supabase_anon_key ||
      config.backend.supabase_app_id ||
      '') as string;
    this.supabaseId = (config.backend.supabase_app_id || '') as string;
    this.siteId = (config.backend.turbo_site_id || '') as string;
    // The editor bridge (editorBridge.ts) is still in development, so a site
    // opts in with `editor_bridge: true`. On by default it would show its badge
    // and "Ask Claude" on every entry, and upload every editor's unsaved draft
    // to Turbo every few seconds, whether or not an agent is connected.
    this.editorBridgeEnabled = config.backend.editor_bridge === true;
    this.commitAuthorEmailFallback =
      ((config.backend as Record<string, unknown>).commit_author_email as string | undefined) ||
      ((config.backend as Record<string, unknown>).noreply_email as string | undefined);

    this.updateUserCredentialsFn = options.updateUserCredentials || (() => undefined);
    this.retrieveUserCredentials = options.retrieveUserCredentials || (() => null);
    this.onSessionInvalid = options.onSessionInvalid || (() => undefined);
    this.reloadEntriesAfterPersist = true;

    this.supabase = new SupabaseClient(
      `https://${this.supabaseId}.supabase.co/rest/v1/data`,
      this.supabaseAnonKey,
      this.branch,
      this.repo,
      this.siteId,
    );
  }

  // Overrides GitLabBackend's own PKCE-based apiRequestFunction entirely —
  // this backend never obtains a GitLab OAuth token at all (the CMS user's
  // only credential is a Supabase JWT), so there is no `refresh_token` grant
  // to fall back to on a 401 the way the plain GitLab backend does. Instead
  // this injects the same x-site-id header / site_id query param scoping
  // that decap-cms-backend-turbo-github's ghFetch/setScopedApiRequestBuilder add for
  // GitHub, so the shared `gl` Edge Function knows which tenant a request
  // belongs to. The request has already had apiRoot prepended by the time
  // requestFunction runs (see API.buildRequest), so scoping is added here
  // rather than at URL-construction time.
  apiRequestFunction = async (req: any): Promise<Response> => {
    if (this.sessionInvalidMessage) return sessionEndedResponse(this.sessionInvalidMessage);
    try {
      await this.refreshSessionIfNeeded();
    } catch (error) {
      // A refresh refused for good has just ended the session. Answered
      // rather than thrown, for the same reason as sessionEndedResponse.
      if (this.sessionInvalidMessage) return sessionEndedResponse(this.sessionInvalidMessage);
      throw error;
    }
    const accessToken = this.supabaseAccessToken || this.token || '';
    const isGlProxyRequest = isProxyUrl(this.apiRoot);

    let scopedReq = req;
    if (accessToken) {
      scopedReq = unsentRequest.withHeaders({ Authorization: `Bearer ${accessToken}` }, scopedReq);
    }
    if (this.siteId && isGlProxyRequest) {
      scopedReq = unsentRequest.withHeaders({ 'x-site-id': this.siteId }, scopedReq);
      scopedReq = unsentRequest.withParams({ site_id: this.siteId }, scopedReq);
    }

    // Coalescing and metering both hang off this one funnel — it is the only
    // place that sees the final, fully scoped request. `recordProxyResponse`
    // sits inside the coalesced work so the save meter counts round trips
    // actually made, rather than letting a joined duplicate inflate the count.
    const response: Response = await this.coalesceRequest(
      coalesceKey(scopedReq.get('method'), unsentRequest.toURL(scopedReq)),
      () =>
        unsentRequest.performRequest(scopedReq).then((res: Response) => {
          // Recorded here because this is the one place every API response
          // passes through — including failures, since a request that failed
          // still cost the editor the wait.
          recordProxyResponse(this.proxyMeter, res);
          return res;
        }),
    );

    if (response.ok || !isGlProxyRequest) return response;
    const body = await peekBody(response);
    const verdict = await this.reactToProxyAuthAnswer(response.status, body, false);
    if (verdict !== 'retry') return exposeProxyError(response, body);

    // The request was built with the refused token; rebuild its header with
    // the one just refreshed. Not coalesced: it is this caller's.
    const retried = unsentRequest.withHeaders(
      { Authorization: `Bearer ${this.supabaseAccessToken}` },
      scopedReq,
    );
    const second: Response = await unsentRequest.performRequest(retried);
    recordProxyResponse(this.proxyMeter, second);
    if (second.ok) return second;
    const secondBody = await peekBody(second);
    await this.reactToProxyAuthAnswer(second.status, secondBody, true);
    return exposeProxyError(second, secondBody);
  };

  /**
   * Plain-fetch counterpart to apiRequestFunction, for Turbo's own `_content/*`
   * routes.
   *
   * Those are not GitLab API calls, so they never pass through
   * decap-cms-backend-gitlab's API client and never reach the interceptor
   * above — but they need the same Supabase bearer token and the same
   * x-site-id / site_id scoping the `gl` Edge Function relies on to know which
   * tenant is calling.
   */
  async glFetch(url: string, init: RequestInit = {}, isRetry = false): Promise<Response> {
    this.assertSessionUsable();
    await this.refreshSessionIfNeeded();
    const accessToken = this.supabaseAccessToken || this.token || '';
    const headers: Record<string, string> = Object.fromEntries(
      new Headers(init.headers || {}).entries(),
    );

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let scopedUrl = url;
    if (this.siteId && scopedUrl.includes('/functions/v1/gl')) {
      headers['x-site-id'] = this.siteId;
      const urlObj = new URL(scopedUrl);
      if (!urlObj.searchParams.has('site_id')) {
        urlObj.searchParams.set('site_id', this.siteId);
      }
      scopedUrl = urlObj.toString();
    }

    const response = await this.coalesceRequest(coalesceKey(init.method, scopedUrl), () =>
      fetch(scopedUrl, { ...init, headers }).then(res => {
        recordProxyResponse(this.proxyMeter, res);
        return res;
      }),
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (isProxyUrl(scopedUrl)) {
        const verdict = await this.reactToProxyAuthAnswer(response.status, body, isRetry);
        if (verdict === 'retry') return this.glFetch(url, init, true);
      }
      throw new APIError(
        proxyErrorMessage(body) || response.statusText,
        response.status,
        'Decap Turbo',
      );
    }

    return response;
  }

  /**
   * One place for the proxy's two "this session cannot continue" answers,
   * which used to surface as an error toast per request and nothing else.
   *
   * - A 401 from the proxy itself means the access token was refused: expired
   *   despite the local clock, or its session revoked server-side (another
   *   tab's CMS logout revokes the session they share). One forced refresh,
   *   ignoring the transient-failure cooldown, decides which: a new token is
   *   worth one retry, a terminal refusal ends the session.
   * - A 403 for a site the user is no longer a member of cannot be fixed from
   *   here at all.
   *
   * Mirrors decap-cms-backend-turbo-github's, where a dead session kept a tab
   * looking logged in and every click cost a request and a toast: 20 refused
   * syncs in 35 s from one editor.
   */
  async reactToProxyAuthAnswer(
    status: number,
    body: string,
    isRetry: boolean,
  ): Promise<'retry' | 'fail'> {
    if (status === 403 && body.includes(SITE_ACCESS_DENIED_MARKER)) {
      this.invalidateSession(TURBO_SITE_ACCESS_DENIED_MESSAGE);
      return 'fail';
    }
    if (status !== 401 || body.trim() !== PROXY_UNAUTHORIZED_BODY) return 'fail';
    if (isRetry || !this.supabaseRefreshToken) {
      this.invalidateSession(SESSION_EXPIRED_MESSAGE);
      return 'fail';
    }
    try {
      await this.getRefreshedAccessToken();
      return 'retry';
    } catch (error) {
      if (this.shouldForceLogoutOnRefreshFailure(error)) {
        this.invalidateSession(this.getRefreshFailureMessage(error));
      }
      return 'fail';
    }
  }

  /**
   * Ends a session that cannot recover: logs out once, hands core the reason
   * (it returns to the login page and shows it), and latches, so whatever is
   * still queued behind this request fails here instead of each going to the
   * proxy for the same answer.
   */
  invalidateSession(message: string) {
    if (this.sessionInvalidMessage) return;
    this.sessionInvalidMessage = message;
    this.logout();
    this.onSessionInvalid(message);
  }

  assertSessionUsable() {
    if (this.sessionInvalidMessage) {
      throw new APIError(this.sessionInvalidMessage, 401, 'Decap Turbo');
    }
  }

  async status() {
    let auth = false;

    if (this.supabaseAccessToken) {
      try {
        const now = Math.floor(Date.now() / 1000);
        const tokenExpiringSoon =
          this.supabaseExpiresAt && this.supabaseExpiresAt - now <= REFRESH_BUFFER_SECONDS;

        if (tokenExpiringSoon && this.supabaseRefreshToken) {
          try {
            await this.getRefreshedAccessToken();
            auth = true;
          } catch (error) {
            const refreshError = error as SupabaseRefreshError;
            auth = !refreshError.isTerminal;
          }
        } else if (!tokenExpiringSoon) {
          auth = true;
        }
      } catch (e) {
        console.warn('Failed checking Supabase auth status', e);
        auth = false;
      }
    }

    return {
      auth: { status: auth },
      api: { status: true, statusPage: '' },
    };
  }

  /**
   * The Turbo session lives on this instance, not only in the auth store core
   * clears — GitLabBackend.logout only nulls `token` and knows nothing about
   * Supabase. Without this, a logged-out CMS kept a usable access token
   * (`status()` would keep reporting `auth: true`), a Supabase client still
   * sending it, and a memoised `currentUser`.
   *
   * A dedicated session (one Turbo minted for this CMS alone) is also revoked
   * server-side, so it cannot outlive the logout. A shared one, from a login
   * before Turbo minted per-CMS sessions, is left alone: it is the dashboard's
   * own session, and one site's CMS logout must not sign the user out of the
   * dashboard and every other site's CMS. Signing out of Turbo is the
   * dashboard's own logout button, and that revokes every session, this
   * CMS's included.
   *
   * Mirrors decap-cms-backend-turbo-github's override, minus the deploy
   * watcher this backend has no equivalent of.
   */
  async logout() {
    if (this.dedicatedSession && this.supabaseAccessToken) {
      revokeSession(
        `https://${this.supabaseId}.supabase.co/auth/v1`,
        this.supabaseAnonKey,
        this.supabaseAccessToken,
      );
    }
    this.dedicatedSession = false;
    this.editorBridgeInstance?.stop();
    this.supabaseAccessToken = null;
    this.supabaseRefreshToken = null;
    this.supabaseExpiresAt = null;
    this.supabaseIdentity = null;
    this.supabase.setAccessToken(null);
    this._currentUserPromise = undefined;
    this.refreshedTokenPromise = undefined;
    this.refreshBlockedUntil = 0;
    return super.logout();
  }

  // Widened to `any`: decap-cms-core only ever forwards whatever this
  // returns to React unchanged (see Backend.authComponent in
  // decap-cms-core/src/backend.ts) — the concrete return type GitLabBackend
  // declares here is an artifact of its own AuthenticationPage's propTypes,
  // not a real contract, and SupabaseAuthenticationPage's props shape
  // legitimately differs (it doesn't need GitLab's OAuth-specific props at
  // all: base_url/siteId/authEndpoint/clearHash).
  authComponent(): any {
    // Unlike decap-cms-backend-turbo-github's GitHub twin, no `backend={this}`
    // injection is needed here — SupabaseAuthenticationPage only ever reads
    // `props.config`/`props.onLogin`, both already supplied by core's
    // standard auth-page render call, so this can return the component
    // directly rather than a wrapping function.
    return SupabaseAuthenticationPage;
  }

  restoreUser(user: User) {
    const supabaseUser = user as SupabaseUser;
    if (supabaseUser.access_token) {
      this.supabaseAccessToken = supabaseUser.access_token;
      this.supabase.setAccessToken(this.supabaseAccessToken);
    }
    if (supabaseUser.refresh_token) {
      this.supabaseRefreshToken = supabaseUser.refresh_token;
    }
    if (supabaseUser.expires_at) {
      this.supabaseExpiresAt = supabaseUser.expires_at;
    }
    return this.authenticate(user);
  }

  editorBridgeEnabled = false;
  editorBridgeInstance: EditorBridge | null = null;

  /**
   * Called by decap-cms-core's Backend with the editor API and the
   * field-action registry (duck-typed; this package does not depend on core).
   * Starts the editor bridge, through which an AI agent can set fields in the
   * entry open in this tab for the person to review and save, and adds the
   * "Ask Claude" action beside each field.
   */
  attachEditor({
    editor,
    registerFieldAction,
  }: {
    editor: EditorApi;
    registerFieldAction: RegisterFieldAction;
  }) {
    const baseUrl = this.baseUrl || (this.supabaseId && `https://${this.supabaseId}.supabase.co`);
    if (!this.editorBridgeEnabled || !baseUrl || !this.siteId || !this.supabaseAnonKey) return;
    this.editorBridgeInstance = new EditorBridge(editor, {
      baseUrl,
      anonKey: this.supabaseAnonKey,
      siteId: this.siteId,
      // Read per request: the token is refreshed during the session.
      getAccessToken: () => this.supabaseAccessToken,
    });
    this.editorBridgeInstance.start();
    registerAskClaudeAction(registerFieldAction, () => this.editorBridgeInstance, this.siteId);
  }

  async authenticate(state: Credentials) {
    this.sessionInvalidMessage = null;
    // Idempotent; ticks do nothing until the session has a token.
    this.editorBridgeInstance?.start();
    if ('access_token' in state) {
      this.supabaseAccessToken = state.access_token as string;
      this.supabase.setAccessToken(this.supabaseAccessToken);
    }
    if ('refresh_token' in state) {
      this.supabaseRefreshToken = state.refresh_token as string;
    }
    if ('expires_at' in state) {
      this.supabaseExpiresAt = state.expires_at as number;
    }
    this.dedicatedSession = (state as SupabaseUser).dedicated_session === true;

    const supabaseState = state as SupabaseUser;
    this.supabaseIdentity = supabaseState;
    const activeSiteFromState = supabaseState.user_metadata?.active_site_id;
    if (this.siteId && this.supabaseAccessToken && activeSiteFromState !== this.siteId) {
      await this.setActiveSiteAndRefresh();
    }

    this.token = state.token as string;

    this.api = new API({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
      useGraphQL: false,
      graphQLAPIRoot: this.graphQLAPIRoot,
      requestFunction: this.apiRequestFunction,
    });

    // GitLabBackend builds these in its own `authenticate`, which this override
    // replaces wholesale - without them the notes pane has no API to call and
    // nothing watching the thread. Rebuilt rather than reused, so a second
    // login on the same instance cannot leave the previous session's manager
    // polling through the previous session's api.
    this.destroyNotesPolling();
    this.notesApi = new GitLabNotesAPI(this.api);
    this.pollingManager = new NotesPollingManager(this.notesApi.asPollingAPI(), 15000);

    // Permissions are only knowable post-auth (the `config` bootstrap
    // endpoint's static preloadConfig hook runs before a user JWT exists), so
    // they are fetched here rather than resolved earlier — but nothing below
    // the write-access check needs them, so the two round trips overlap
    // instead of queueing. `currentUser` is local (session identity, no
    // fetch), so it joins them for free.
    //
    // Unlike the GitHub twin, `hasWriteAccess` is NOT redundant here: this
    // backend commits with the organization's GitLab group token, and whether
    // that token can write to this project is a real question with a real
    // answer, enforced below. On GitHub the equivalent check was asking about
    // a signed-in GitHub user that Turbo does not have.
    const [user, turboPermissions] = await Promise.all([
      this.api.user(),
      this.fetchTurboPermissions(),
    ]);

    const isCollab = await this.api.hasWriteAccess().catch((error: Error) => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If your project is under a group, ensure the group's access token has been granted to this project.
      `;
      throw error;
    });

    if (!isCollab) {
      throw new Error(
        'The configured GitLab access token does not have write access to this project.',
      );
    }

    if (!this.isBranchConfigured) {
      const defaultBranch = await this.api.getDefaultBranch().catch(() => null);
      if (defaultBranch?.name) {
        this.branch = defaultBranch.name;
      }
    }

    const commitAuthor = resolveCommitAuthorFromSupabaseUser(
      state as SupabaseUser,
      this.commitAuthorEmailFallback,
    );
    this.api.commitAuthor = commitAuthor;

    // `turboPermissions` was resolved above, alongside the user. It is attached
    // to the returned user object because decap-cms-core's actions/auth.ts
    // picks `permissions` up off it generically (the field name is
    // backend-neutral by design — any backend could set it) and re-filters the
    // loaded config against it.

    recordCmsEvent(
      this.baseUrl!,
      this.supabaseAnonKey,
      this.supabaseAccessToken,
      'cms_session_started',
      this.siteId,
    );

    const displayIdentity = this.sessionIdentity();

    return {
      ...user,
      login: user.username,
      // The `gl` proxy synthesizes /user itself (the CMS user has no real
      // GitLab identity), and falls back to the literal name "CMS Editor"
      // when Supabase knows no full name — so prefer what the session says
      // about the person. This object is what core stores and the header
      // renders.
      ...(displayIdentity.name && { name: displayIdentity.name }),
      ...(displayIdentity.email && { email: displayIdentity.email }),
      avatar_url: displayIdentity.avatarUrl ?? user.avatar_url ?? null,
      token: state.token as string,
      ...('access_token' in state && { access_token: state.access_token }),
      ...('refresh_token' in state && { refresh_token: state.refresh_token }),
      ...('expires_at' in state && { expires_at: state.expires_at }),
      dedicated_session: this.dedicatedSession,
      ...('user_name' in state && { user_name: (state as SupabaseUser).user_name }),
      ...('user_email' in state && { user_email: (state as SupabaseUser).user_email }),
      ...('email' in state && { email: (state as SupabaseUser).email }),
      ...('user_metadata' in state && { user_metadata: (state as SupabaseUser).user_metadata }),
      ...(turboPermissions && { permissions: turboPermissions }),
    };
  }

  async fetchTurboPermissions(): Promise<{ collections?: Record<string, string> } | undefined> {
    if (!this.supabaseAccessToken || !this.siteId) {
      return undefined;
    }

    // Refresh first, like every other call site that sends this token
    // (`ghFetch`/`glFetch`, `setActiveSiteAndRefresh`, `getToken`). While this
    // ran after `api.user()` it inherited the refresh `currentUser` performs;
    // running the two concurrently made it read a token that was still
    // expiring, and a 401 here does not fail loudly — it silently drops the
    // editor's collection restrictions. Refreshes are memoised on
    // `refreshedTokenPromise`, so sharing one with `currentUser` costs nothing.
    await this.refreshSessionIfNeeded();

    let res: Response;
    try {
      res = await fetch(
        `${this.baseUrl}/functions/v1/permissions?site_id=${encodeURIComponent(this.siteId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.supabaseAccessToken}`,
            apikey: this.supabaseAnonKey,
          },
        },
      );
    } catch (error) {
      console.warn('Failed to fetch Turbo site permissions', error);
      return undefined;
    }

    // 403 is the one answer that is not a soft failure: the endpoint returns it
    // only when the signed-in user has no membership on this site. Team
    // membership alone is not enough (owners included), and the gl proxy
    // refuses every request on the same grounds — so letting the login through
    // put the editor in a "logged in" CMS where every collection load raised
    // its own 403 toast. Failing here turns that into a single error on the
    // login page, and on a restored session core logs the user out.
    if (res.status === 403) {
      this.logout();
      throw new Error(TURBO_SITE_ACCESS_DENIED_MESSAGE);
    }

    if (!res.ok) {
      console.warn('Failed to fetch Turbo site permissions', res.status);
      return undefined;
    }
    return res.json().catch((error: unknown) => {
      console.warn('Failed to fetch Turbo site permissions', error);
      return undefined;
    });
  }

  async setActiveSiteAndRefresh() {
    if (!this.supabaseAccessToken || !this.siteId) {
      return;
    }

    // Proactive: a restored session's access token is commonly past `exp` by
    // the time this runs (it's checked before any other request), so refresh
    // it first using the same buffer/backoff/terminal-detection every other
    // call site in this class already applies, instead of handing a stale
    // token straight to Supabase.
    await this.refreshSessionIfNeeded();

    const putActiveSiteId = () =>
      fetch(`https://${this.supabaseId}.supabase.co/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAccessToken}`,
        },
        body: JSON.stringify({
          data: {
            active_site_id: this.siteId,
          },
        }),
      });

    let updateResponse = await putActiveSiteId();

    if (!updateResponse.ok && (updateResponse.status === 401 || updateResponse.status === 403)) {
      // Reactive fallback: covers a stored session with no `expires_at` (so
      // the proactive check above was a no-op) or a token invalidated after
      // that check ran. One refresh-then-retry, same as everywhere else.
      const refreshed = await this.getRefreshedAccessToken().then(
        () => true,
        () => false,
      );
      if (refreshed) {
        updateResponse = await putActiveSiteId();
      }
    }

    if (!updateResponse.ok) {
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    // The metadata is already set server-side at this point; refreshing now
    // only opportunistically rolls the new active_site_id into a fresh JWT's
    // claims. A failure here (e.g. a refresh token already rotated by another
    // tab) shouldn't undo an otherwise-successful login on a still-valid
    // access token.
    await this.getRefreshedAccessToken().catch(error => {
      console.warn('Failed to refresh Supabase token after setting active_site_id', error);
    });
  }

  isOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  isTerminalRefreshFailure(status?: number, code?: string) {
    if (status === 401) {
      return true;
    }
    // ANY 400 from the refresh grant is terminal — see the GitHub twin for the
    // full reasoning. GoTrue answers a refresh it cannot honour with 400 and
    // one of several codes (`refresh_token_not_found`,
    // `refresh_token_already_used`, `invalid_grant`, `invalid_refresh_token`,
    // `session_not_found`, `session_expired`), all of which mean the token is
    // dead. Allow-listing two of them made a dead session look transient and
    // turned one collection load into a refresh storm the session could never
    // recover from.
    if (status === 400) {
      return true;
    }
    return TERMINAL_REFRESH_CODES.has(String(code));
  }

  isRetryableStatus(status?: number) {
    if (!status) {
      return true;
    }
    if (status === 408 || status === 429) {
      return true;
    }
    return status >= 500;
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchSupabaseRefreshToken() {
    if (!this.supabaseRefreshToken) {
      const noTokenError = new Error('No refresh token available') as SupabaseRefreshError;
      noTokenError.isTerminal = true;
      throw noTokenError;
    }

    const response = await fetch(
      `https://${this.supabaseId}.supabase.co/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey,
        },
        body: JSON.stringify({
          refresh_token: this.supabaseRefreshToken,
        }),
      },
    );

    if (!response.ok) {
      let errorBody: { error_code?: string; error?: string } | undefined;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = undefined;
      }

      const refreshError = new Error('Failed to refresh Supabase token') as SupabaseRefreshError;
      refreshError.status = response.status;
      refreshError.code = errorBody?.error_code || errorBody?.error;
      refreshError.isTerminal = this.isTerminalRefreshFailure(
        refreshError.status,
        refreshError.code,
      );
      throw refreshError;
    }

    return response.json();
  }

  // Overrides GitLabBackend's own getRefreshedAccessToken (PKCE-based, tied
  // to a real GitLab OAuth grant) — this backend refreshes a Supabase
  // session, not a GitLab token, same as decap-cms-backend-turbo-github does for
  // GitHub (which has no refresh concept of its own to override).
  async getRefreshedAccessToken(): Promise<string> {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }
    this.refreshedTokenPromise = withRefreshLock(async () => {
      // A tab that held the lock before this one may have already spent the
      // refresh token this tab holds. Taking over what it stored is the only
      // way to keep this session, and may make a refresh unnecessary.
      if (this.adoptRotatedSession() && !this.isSessionExpiringSoon()) {
        return this.supabaseAccessToken as string;
      }

      let lastError: SupabaseRefreshError | undefined;

      for (let attempt = 1; attempt <= REFRESH_RETRY_ATTEMPTS; attempt++) {
        try {
          const data = await this.fetchSupabaseRefreshToken();
          this.useSessionTokens(data);

          this.updateUserCredentialsFn({
            token: data.access_token,
            refresh_token: data.refresh_token,
            access_token: data.access_token,
            expires_at: data.expires_at,
          } as any);

          return data.access_token;
        } catch (error) {
          const refreshError = error as SupabaseRefreshError;
          if (typeof refreshError.isTerminal !== 'boolean') {
            refreshError.isTerminal = this.isOffline()
              ? false
              : !this.isRetryableStatus(refreshError.status);
          }

          lastError = refreshError;
          const canRetry = !refreshError.isTerminal && attempt < REFRESH_RETRY_ATTEMPTS;
          if (!canRetry) {
            break;
          }

          await this.delay(250 * attempt);
        }
      }

      throw lastError || new Error('Failed to refresh Supabase token');
    })
      .catch((error: Error) => {
        const refreshError = error as SupabaseRefreshError;
        if (typeof refreshError.isTerminal !== 'boolean') {
          refreshError.isTerminal = false;
        }
        throw refreshError;
      })
      .finally(() => {
        this.refreshedTokenPromise = undefined;
      });

    return this.refreshedTokenPromise;
  }

  useSessionTokens(session: { access_token: string; refresh_token: string; expires_at: number }) {
    this.supabaseAccessToken = session.access_token;
    this.supabaseRefreshToken = session.refresh_token;
    this.supabaseExpiresAt = session.expires_at;
    this.supabase.setAccessToken(this.supabaseAccessToken);
    this.token = session.access_token;
    if (this.api) {
      this.api.token = session.access_token;
    }
    this._currentUserPromise = undefined;
    this.refreshBlockedUntil = 0;
  }

  isSessionExpiringSoon() {
    const now = Math.floor(Date.now() / 1000);
    return !this.supabaseExpiresAt || this.supabaseExpiresAt - now < REFRESH_BUFFER_SECONDS;
  }

  /**
   * Takes over this session's tokens from the stored user when another tab of
   * this CMS has rotated them since this tab last looked. Returns whether it
   * did. Must run under the refresh lock, or the stored pair can be spent
   * between reading it here and using it.
   *
   * Only the same session is adopted, matched on the `session_id` claim: a
   * stored user from a later login, possibly as somebody else, is not this
   * tab's to pick up.
   */
  adoptRotatedSession() {
    const stored = this.retrieveUserCredentials() as SupabaseUser | null;
    if (!stored?.access_token || !stored.refresh_token || !stored.expires_at) return false;
    if (stored.refresh_token === this.supabaseRefreshToken) return false;
    const ownSessionId = sessionIdOf(this.supabaseAccessToken);
    if (!ownSessionId || sessionIdOf(stored.access_token) !== ownSessionId) return false;

    this.useSessionTokens({
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
      expires_at: stored.expires_at,
    });
    return true;
  }

  shouldForceLogoutOnRefreshFailure(error: unknown) {
    const refreshError = error as SupabaseRefreshError;
    return Boolean(refreshError?.isTerminal);
  }

  getRefreshFailureMessage(error: unknown) {
    if (this.shouldForceLogoutOnRefreshFailure(error)) {
      return SESSION_EXPIRED_MESSAGE;
    }
    if (this.isOffline()) {
      return 'Unable to refresh session while offline. Please reconnect and retry.';
    }
    return 'Unable to refresh session right now. Please retry in a moment.';
  }

  async refreshSessionIfNeeded() {
    const now = Math.floor(Date.now() / 1000);
    if (!this.supabaseExpiresAt && this.supabaseAccessToken) {
      // A stored user saved without `expires_at` used to skip refreshing
      // forever, and its token started failing an hour in.
      this.supabaseExpiresAt = expiresAtOf(this.supabaseAccessToken);
    }
    if (!this.supabaseExpiresAt || this.supabaseExpiresAt - now >= REFRESH_BUFFER_SECONDS) {
      return;
    }

    // A refresh that just failed for a reason we decided NOT to log out over
    // (offline, 5xx, a rate limit) is not worth re-attempting once per
    // request: `refreshedTokenPromise` only dedupes refreshes that overlap in
    // flight, and a collection load fires its entries sequentially.
    if (Date.now() < this.refreshBlockedUntil) {
      return;
    }

    try {
      await this.getRefreshedAccessToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      if (this.shouldForceLogoutOnRefreshFailure(error)) {
        const message = this.getRefreshFailureMessage(error);
        this.invalidateSession(message);
        throw new Error(message);
      }
      this.refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
    }
  }

  async getToken(): Promise<string | null> {
    await this.refreshSessionIfNeeded();
    return this.supabaseAccessToken || this.token || null;
  }

  /**
   * Who is signed in, as the CMS header should show them: display name, email
   * and (for OAuth sign-ins) avatar, taken from the Turbo session rather than
   * from the project. Until this existed the header could only name the group,
   * which made a silent re-login — the Turbo dashboard session outlives a CMS
   * logout by design, so "Login with Turbo" completes without a prompt —
   * indistinguishable from a login as somebody else.
   *
   * Deliberately does not consult `commitAuthorEmailFallback`: a site-level
   * noreply address is a reasonable commit author, but it is not a person who
   * logged in.
   */
  sessionIdentity() {
    const author = resolveCommitAuthorFromSupabaseUser(this.supabaseIdentity ?? {});
    const metadata = this.supabaseIdentity?.user_metadata;
    return {
      name: author?.name,
      email: author?.email,
      avatarUrl: metadata?.avatar_url || metadata?.picture || null,
    };
  }

  /**
   * Who the signed-in editor is, as a note records them.
   *
   * Overrides GitLabBackend's, which reads the username off `api.user()`. On
   * this backend that route is answered by the proxy rather than GitLab, from
   * the local part of the editor's email - so two editors at different domains
   * who share one collide, and the pane would name people "decap" rather than
   * by their display name.
   *
   * Unlike the GitHub and GitLab backends, this one DOES record an id. There
   * the editor posts the comment themselves, so the host reports their current
   * username on every read and ownership follows a rename on its own; here
   * every note is posted with the organization's group token, so the comment
   * says nothing about who wrote it and the note body has to.
   *
   * Local, so it also spares the `/gl/user` round trip the inherited one made.
   */
  async noteAuthorIdentity(): Promise<{ author: string; authorId?: string }> {
    const identity = this.sessionIdentity();
    return {
      author: identity.name || identity.email || '',
      authorId: supabaseUserIdFromToken(this.supabaseAccessToken),
    };
  }

  async currentUser(
    { token }: { token: string } = { token: this.token || '' },
  ): Promise<GitLabUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = (async () => {
        await this.refreshSessionIfNeeded();

        const owner = this.repo.split('/')[0];
        const identity = this.sessionIdentity();

        // `username` stays the project owner: other GitLab code paths treat it
        // as an identifier, not as a display name. `name`, `email` and the
        // avatar are the human-facing fields, and they now name the person
        // rather than the group.
        return {
          id: 0,
          name: identity.name || owner,
          username: owner,
          email: identity.email,
          avatar_url: identity.avatarUrl,
          token,
          access_token: this.supabaseAccessToken || undefined,
          refresh_token: this.supabaseRefreshToken || undefined,
          expires_at: this.supabaseExpiresAt || undefined,
        };
      })();
    }
    return this._currentUserPromise;
  }

  /**
   * Reads one entry, verifying the cached row is current before trusting it.
   *
   * Collection loads revalidate the branch head on every sync, but this path is
   * reached directly — core's loadEntry on a deep link, and once per
   * non-default locale for multiple_files/multiple_folders i18n — so without
   * it the cache is trusted unconditionally.
   *
   * A stale read here is a lost update, not stale display: a save rebases onto
   * the branch's current head and rewrites the edited path, so saving stale
   * content silently reverts whoever committed in between.
   */
  async getEntry(path: string) {
    const cached = await this.supabase.fetchEntryByPath(path);
    if (!cached) {
      return super.getEntry(path);
    }

    try {
      const response = await this.glFetch(`${this.apiRoot}/_content/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, branch: this.branch }),
      });
      const { fresh } = await response.json();
      if (fresh) {
        return cached;
      }
    } catch (error) {
      // Falling through to GitLab on an unreachable check is the safe
      // direction: it costs requests, where trusting the cache costs edits.
      console.warn('Turbo entry freshness check failed, reading from GitLab', error);
    }

    return super.getEntry(path);
  }

  async persistEntry(entry: any, options: any = {}) {
    // Timed around super.persistEntry rather than around the network calls
    // themselves, so the number includes lock acquisition — which is time the
    // editor waits with the save spinner up, whatever it is spent on.
    const meter = createProxyMeter();
    this.proxyMeter = meter;
    const startedAt = Date.now();

    let result;
    try {
      result = await super.persistEntry(entry, options);
    } finally {
      this.proxyMeter = null;
    }

    const durationMs = Date.now() - startedAt;

    // The branch this save actually committed to. An editorial-workflow save
    // goes to the entry's own `cms/<collection>/<slug>` branch, not the site's,
    // so logging this.branch made a draft read as a publish in the org's
    // activity feed (decap-turbo docs/pre-production-review-findings.md L8).
    // Derived the same way GitLabBackend's own persistFiles does.
    const savedBranch = options.useWorkflow
      ? branchFromContentKey(
          generateContentKey(options.collectionName as string, entry.dataFiles?.[0]?.slug),
        )
      : this.branch;

    if (result && entry.dataFiles && entry.dataFiles.length > 0) {
      // Deliberately does not write the cache — the server owns it. The commit
      // moves the branch head and reloadEntriesAfterPersist makes core re-list
      // immediately, so the next sync materialises the saved entry. Writing
      // from here cannot work anyway: core's dataFiles carry no `id`, so any
      // row written would keep its pre-save blob sha.
      recordCmsEvent(
        this.baseUrl!,
        this.supabaseAnonKey,
        this.supabaseAccessToken,
        'cms_entry_saved',
        this.siteId,
        {
          collection: options.collectionName,
          slug: entry.dataFiles[0].slug,
          path: entry.dataFiles[0].path,
          branch: savedBranch,
          // Whether this was an editorial-workflow draft. The branch alone
          // can't say so — a site is free to publish from a `cms/...` branch.
          workflow: options.useWorkflow === true,
          // No authorEmail. It was a second copy of an email the row already
          // identifies through the server-derived user_id, and the activity
          // feed's fallback to it never fired (decap-turbo H12). The server
          // drops the key regardless, so an older bundle sending it stores
          // nothing either.
          // Baseline for the one-call commit endpoint (decap-turbo
          // docs/deploy-status-plan.md B5 -> B1). GitLab already commits in a
          // single API call, so `requests` here is expected to be far lower
          // than GitHub's — which is itself the comparison worth having.
          durationMs,
          requests: meter.requests,
          // Omitted rather than sent as 0 when no response carried a readable
          // Server-Timing, so "not measured" never averages in as "instant".
          ...(meter.upstreamMeasured && { upstreamMs: Math.round(meter.upstreamMs) }),
          files: entry.dataFiles.length + (entry.assets?.length ?? 0),
          bytes: measurePayloadBytes(entry.dataFiles, entry.assets),
        },
      );
    }
    return result;
  }

  /**
   * Caches the i18n locale files the collection listing leaves out.
   *
   * `collectionRegex` narrows a listing to the default locale — one card per
   * entry is what a list wants — so with `structure: multiple_files` only
   * `slug.en.md` was ever ingested, and the editor, which reads every locale
   * as its own file, missed the cache on each sibling and fell through to
   * GitLab on every entry open.
   *
   * Its own collection key, not the listing's, so `fetchEntries` still returns
   * one row per entry — the sibling rows are found by `fetchEntryByPath`,
   * which matches on path alone and does not care which collection tagged
   * them. Not awaited: nothing on this load needs it, and the entry it serves
   * is a human click away, by which time the sync has long finished.
   */
  private warmLocaleSiblings(
    folder: string,
    extension: string,
    depth: number,
    localeSiblingRegex?: RegExp,
  ) {
    if (!localeSiblingRegex) {
      return;
    }

    const collection = `${folder}:${extension}:${depth}:${localeSiblingRegex.toString()}`;
    // Swallowed rather than surfaced: this is a prefetch, and the entry open
    // it optimises reads from GitLab perfectly well without it.
    this.syncCollection(collection, folder, extension, depth, localeSiblingRegex).catch(
      () => undefined,
    );
  }

  async allEntriesByFolder(
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
    searchTerm?: string,
    localeSiblingRegex?: RegExp,
  ) {
    const collection = `${folder}:${extension}:${depth}:${pathRegex?.toString() || 'all'}`;

    this.warmLocaleSiblings(folder, extension, depth, localeSiblingRegex);

    // One request, in place of a tree listing plus a file read and a commits
    // lookup per entry, driven from the browser.
    await this.syncCollection(collection, folder, extension, depth, pathRegex);

    const entries = await this.supabase.fetchEntries(collection, searchTerm);

    // The client no longer lists a tree, so sort by path to keep entry order
    // stable across loads. Path order is what the tree gave anyway.
    entries.sort((a: any, b: any) =>
      String(a.file?.path ?? '').localeCompare(String(b.file?.path ?? '')),
    );

    return entries;
  }

  async syncCollection(
    collection: string,
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
  ) {
    return this.postCollectionSync({
      name: collection,
      folder,
      extension,
      depth,
      // Source + flags rather than a stringified literal, so the server can
      // rebuild the exact RegExp without parsing `/.../flags`.
      ...(pathRegex && { pathRegexSource: pathRegex.source, pathRegexFlags: pathRegex.flags }),
    });
  }

  async postCollectionSync(collection: Record<string, unknown>) {
    const response = await this.glFetch(`${this.apiRoot}/_content/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, branch: this.branch }),
    });
    const result = await response.json();

    // The server declines to fan out when the organization's GitLab budget is
    // near its floor, so an editor's own requests keep working. The read below
    // still happens and serves whatever is cached — the same outcome as losing
    // the single-flight race — but a silently short collection is worth saying
    // out loud, because otherwise the only symptom is missing entries.
    if (result?.deferred) {
      console.warn(
        `Turbo deferred the sync for "${collection.name}": the GitLab API budget is low ` +
          `(${result.rate_limited?.remaining} left). Showing cached content; it will catch up ` +
          'once the budget recovers.',
      );
    }

    return result;
  }

  /**
   * Files collections were the last read path still going straight to GitLab —
   * a read plus a commits lookup per file on every load, uncached. They share
   * the whole sync pipeline with folder collections, differing only in how
   * paths are selected.
   */
  async entriesByFiles(files: { path: string; label?: string }[]) {
    const paths = files.map(file => file.path);
    if (paths.length === 0) {
      return [];
    }

    const collection = collectionKeyForFiles(paths);
    await this.postCollectionSync({ name: collection, files: paths });

    const entries = await this.supabase.fetchEntries(collection);
    const byPath = new Map(entries.map((entry: any) => [String(entry.file?.path), entry]));

    // Every configured file must produce an entry, including ones that do not
    // exist in the repo yet — an unsaved entry is how the editor creates them.
    // Syncing from a tree drops them, so they are reinstated here.
    return files.map(file => byPath.get(file.path) ?? { file: { ...file, id: null }, data: '' });
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    return this.allEntriesByFolder(folder, extension, depth);
  }
}
