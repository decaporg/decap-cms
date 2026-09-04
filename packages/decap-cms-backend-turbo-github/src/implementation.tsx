import { GitHubBackend } from 'decap-cms-backend-github';
import {
  type Config,
  type User,
  type Credentials,
  APIError,
  collectionKeyForFiles,
  unsentRequest,
} from 'decap-cms-lib-util';
import GraphQLAPI from 'decap-cms-backend-github/src/GraphQLAPI';

import TurboAPI from './API';
import { SupabaseClient } from './supabase';
import SupabaseAuthenticationPage from './AuthenticationPage';
import { resolveCommitAuthorFromSupabaseUser } from './commitAuthor';
import { coalesceKey, createRequestCoalescer, type RequestCoalescer } from './requestCoalescer';
import { recordCmsEvent } from './telemetry';
import {
  createProxyMeter,
  measurePayloadBytes,
  recordProxyResponse,
  type ProxyMeter,
} from './saveMetrics';
import {
  createDeployWatcher,
  createDeploymentLister,
  createCommitLister,
  parseDeployStatusOptions,
  type DeployWatcher,
  type DeployResolution,
  type DeployStatusOptions,
  type DeployStatusConfig,
  type DeploymentRow,
  type CommitRow,
  type WatchStatus,
} from './deployWatcher';

import type { GitHubUser } from 'decap-cms-backend-github/src/implementation';

interface SupabaseUser extends User {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
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


// Shared control-plane values (supabase_app_id, supabase_anon_key, base_url,
// api_root) are identical across every site, so a site's config.yml only
// needs `turbo_site_id`. This is resolved here, in this backend's own code,
// rather than in decap-cms-core — core has no knowledge of Supabase or
// Turbo at all; it just awaits this static `preloadConfig` hook (a generic
// extension point) before constructing the backend.
const DEFAULT_CONFIG_ENDPOINT = 'https://sb.decapcms.org/functions/v1/config';

export default class DecapTurboGitHubBackend extends GitHubBackend {
  static async preloadConfig(config: Config): Promise<Config> {
    const backend = config.backend as Record<string, unknown>;
    const isFullyManuallyConfigured = Boolean(backend.supabase_app_id && backend.supabase_anon_key);
    if (isFullyManuallyConfigured) {
      return config;
    }

    if (backend.supabase_app_id && !backend.supabase_anon_key) {
      // Half-manual config: `supabase_app_id` alone is not a usable anon key,
      // so failing loudly here beats the constructor silently falling back
      // to treating the project ref as the anon key.
      throw new Error(
        "turbo-github config error: 'supabase_app_id' is set without 'supabase_anon_key'. " +
          "Provide both to configure manually, or provide only 'turbo_site_id' to fetch " +
          'both from the control plane.',
      );
    }

    if (!backend.turbo_site_id) {
      // Nothing to resolve and nothing manually configured.
      return config;
    }

    const endpoint = (backend.turbo_config_url as string) || DEFAULT_CONFIG_ENDPOINT;
    const response = await fetch(
      `${endpoint}?site_id=${encodeURIComponent(backend.turbo_site_id as string)}`,
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        `Failed to load turbo-github site defaults: ${body.error || response.status}`,
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
        // `repo` is authoritative from the sites row, not config.yml: the
        // proxy resolves permissions from sites.repo, so a stale local value
        // here is exactly what makes checkRepoScope 403 with "requested repo
        // does not match".
        ...(repo ? { repo } : {}),
        // `branch` is the opposite: one sites row legitimately serves several
        // deploys of the same repo (a production site on `main`, a staging
        // site on `develop`), and each deploy says which branch it edits in
        // its own config.yml. The proxy takes the branch per request — the
        // content cache is keyed by (site, repo, branch) — so config.yml wins
        // whenever it names one, and the sites row is only the default for a
        // config.yml that leaves it out.
        ...(branch && !config.backend.branch ? { branch } : {}),
      },
    };
  }

  supabaseAccessToken: string | null = null;
  supabaseRefreshToken: string | null = null;
  supabaseExpiresAt: number | null = null;
  /**
   * The signed-in person, as opposed to the repo being edited: email, display
   * name and (for OAuth sign-ins) avatar, straight off the Turbo session.
   * `currentUser` reports these to the header. Survives a reload because
   * `authenticate` returns the same fields on the stored user object, which
   * `restoreUser` hands straight back. Cleared by `logout`.
   */
  supabaseIdentity: SupabaseUser | null = null;
  supabaseAnonKey: string;
  supabaseId: string;
  siteId: string;
  commitAuthorEmailFallback?: string;
  // API.commitAuthor is typed as an untyped `{}`, so this mirrors its email
  // in a typed field for callers (e.g. telemetry) that need to read it back.
  commitAuthorEmail?: string;
  updateUserCredentials: (credentials: Credentials) => void;
  refreshedTokenPromise?: Promise<string>;
  /** Epoch ms before which refreshSessionIfNeeded will not try again. */
  refreshBlockedUntil = 0;
  reloadEntriesAfterPersist?: boolean;
  /**
   * Non-null only while a save is in flight. Every proxied response is folded
   * into it, so `cms_entry_saved` can report how many round trips that one save
   * cost and how much of the wait was GitHub's own time. Null the rest of the
   * time, so ordinary reads are not counted.
   */
  proxyMeter: ProxyMeter | null = null;

  /**
   * Joins concurrent identical reads. One per backend instance, so every read
   * path — the proxied GitHub API via `requestFunction` and this backend's own
   * `ghFetch` — shares a single view of what is already in flight.
   */
  protected coalesceRequest: RequestCoalescer = createRequestCoalescer();

  supabase: SupabaseClient;

  /**
   * Lazily built, because most of a session never saves anything and a site
   * with no deploy hook never needs one at all.
   */
  private deployWatcherInstance: DeployWatcher | null = null;

  /**
   * The commit the last save produced, and the entry it saved. Core awaits
   * `persistEntry` without reading its return value, so this is the only place
   * the new sha can be captured — and the sha is what the deploy ledger keys
   * on. Null after a save that produced no sha (the REST fallback path), so a
   * save can never be recorded against a previous save's commit.
   */
  lastSavedCommit: { sha: string; entryPath?: string } | null = null;

  /** Whether editors see deploy status at all, and which host counts (§A7). */
  private deployStatusOptions: DeployStatusOptions = parseDeployStatusOptions(undefined);

  constructor(config: Config, options: any = {}) {
    super(config, options);

    // GraphQLAPI (used when use_graphql is set) builds its own Apollo
    // transport directly off the constructor config and never goes through
    // setScopedApiRequestBuilder's patched urlFor/requestHeaders below — so
    // every GraphQL request would silently skip the x-site-id/site_id
    // scoping the shared `gh` Edge Function relies on to know which
    // tenant a request belongs to. Rather than retrofit Apollo's transport
    // with scoping, reject the combination outright: nothing currently
    // configures use_graphql for this backend, so this can't regress an
    // existing site.
    if (this.useGraphql) {
      throw new Error(
        "Decap Turbo backend does not support 'use_graphql: true' — GraphQL requests would bypass per-site tenant scoping. Remove use_graphql from your config.",
      );
    }

    this.supabaseAnonKey = (config.backend.supabase_anon_key ||
      config.backend.supabase_app_id ||
      '') as string;
    this.supabaseId = (config.backend.supabase_app_id || '') as string;
    this.siteId = (config.backend.turbo_site_id || '') as string;
    this.deployStatusOptions = parseDeployStatusOptions(
      (config.backend as Record<string, unknown>).deploy_status,
    );
    this.commitAuthorEmailFallback =
      ((config.backend as Record<string, unknown>).commit_author_email as string | undefined) ||
      ((config.backend as Record<string, unknown>).noreply_email as string | undefined);

    this.updateUserCredentials = options.updateUserCredentials || (() => undefined);

    this.bypassWriteAccessCheckForAppTokens = true;
    this.tokenKeyword = 'Bearer';
    this.reloadEntriesAfterPersist = true;

    this.supabase = new SupabaseClient(
      `https://${this.supabaseId}.supabase.co/rest/v1/data`,
      this.supabaseAnonKey,
      this.branch,
      this.originRepo,
      this.siteId,
    );
  }

  async ghFetch(url: string, init: RequestInit = {}) {
    await this.refreshSessionIfNeeded();
    const accessToken = this.supabaseAccessToken || this.token || '';
    const headers: Record<string, string> = Object.fromEntries(
      new Headers(init.headers || {}).entries(),
    );

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let scopedUrl = url;
    const isGhProxyRequest = scopedUrl.includes('/functions/v1/gh');
    if (this.siteId && isGhProxyRequest) {
      headers['x-site-id'] = this.siteId;
      const urlObj = new URL(scopedUrl);
      if (!urlObj.searchParams.has('site_id')) {
        urlObj.searchParams.set('site_id', this.siteId);
      }
      scopedUrl = urlObj.toString();
    }

    const response = await this.coalesceRequest(coalesceKey(init.method, scopedUrl), () =>
      fetch(scopedUrl, {
        ...init,
        headers,
      }).then(res => {
        // Before the ok-check: a request that failed still cost the editor the
        // wait, and a save that is slow *because* it is retrying is exactly the
        // case the measurement exists to catch.
        recordProxyResponse(this.proxyMeter, res);
        return res;
      }),
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new APIError(body || response.statusText, response.status, 'Decap Turbo');
    }

    return response;
  }

  setScopedApiRequestBuilder() {
    if (!this.api) {
      return;
    }

    const isGhProxyApiRoot = this.apiRoot.includes('/functions/v1/gh');
    const api = this.api;

    const originalUrlFor = this.api.urlFor.bind(this.api);
    this.api.urlFor = (path: string, options: any) => {
      const builtUrl = originalUrlFor(path, options);
      if (!this.siteId || !isGhProxyApiRoot) {
        return builtUrl;
      }
      const urlObj = new URL(builtUrl);
      if (!urlObj.searchParams.has('site_id')) {
        urlObj.searchParams.set('site_id', this.siteId);
      }
      return urlObj.toString();
    };

    const originalRequestHeaders = this.api.requestHeaders.bind(this.api);
    this.api.requestHeaders = async (headers: Record<string, string> = {}) => {
      if (isGhProxyApiRoot) {
        await this.refreshSessionIfNeeded();
        api.token = this.supabaseAccessToken || this.token || '';
      }
      const builtHeaders = await originalRequestHeaders(headers);
      if (!this.siteId || !isGhProxyApiRoot) {
        return builtHeaders;
      }
      return { ...builtHeaders, 'x-site-id': this.siteId };
    };

    // lib-util's requestWithBackoff reads `api.requestFunction` off the
    // instance and falls back to unsentRequest.performRequest, so this is the
    // one place every API request's Response passes through — urlFor and
    // requestHeaders above only see the request side. Scoping is already
    // applied by the time this runs.
    //
    // Two things hang off that: the save meter observes every response, and
    // concurrent identical reads are folded into one round trip. Both belong
    // here rather than further out because this is the only funnel that sees
    // the final, fully scoped URL.
    //
    // `recordProxyResponse` sits inside the coalesced work, not outside it, so
    // the meter counts round trips actually made — a joined duplicate should
    // not inflate a save's request count.
    //
    // Cast because the hook is declared on lib-util's API interface (and read
    // there) but not redeclared on decap-cms-backend-github's own API class —
    // the same reason turbo-gitlab can assign it directly and this cannot.
    (api as unknown as { requestFunction?: (req: unknown) => Promise<Response> }).requestFunction =
      req => {
        const request = req as { get: (key: string) => string | undefined };
        return this.coalesceRequest(
          coalesceKey(request.get('method'), unsentRequest.toURL(req as never)),
          () =>
            (unsentRequest.performRequest(req as never) as Promise<Response>).then(response => {
              recordProxyResponse(this.proxyMeter, response);
              return response;
            }),
        );
      };
  }

  async status() {
    // Check Supabase authentication status
    let auth = false;

    if (this.supabaseAccessToken) {
      // Try to verify the token is still valid by checking if we can get user info
      try {
        const now = Math.floor(Date.now() / 1000);
        const tokenExpiringSoon =
          this.supabaseExpiresAt && this.supabaseExpiresAt - now <= REFRESH_BUFFER_SECONDS;

        if (tokenExpiringSoon && this.supabaseRefreshToken) {
          // Try to refresh if expired
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

    // Get parent GitHub API status
    const parentStatus = await super.status();

    return {
      auth: { status: auth },
      api: parentStatus.api,
    };
  }

  /**
   * The Turbo session lives on this instance, not only in the auth store core
   * clears — GitHubBackend.logout knows nothing about Supabase. Without this,
   * a logged-out CMS kept a usable access token (`status()` would keep
   * reporting `auth: true`), a Supabase client still sending it, a memoised
   * `currentUser`, and a live deploy subscription.
   *
   * This deliberately does NOT end the Turbo session itself: that cookie
   * belongs to the dashboard's origin, and one site's CMS logout must not sign
   * the user out of the dashboard and every other site's CMS. Signing out of
   * Turbo is the dashboard's own logout button.
   */
  logout() {
    this.supabaseAccessToken = null;
    this.supabaseRefreshToken = null;
    this.supabaseExpiresAt = null;
    this.supabaseIdentity = null;
    this.supabase.setAccessToken(null);
    this._currentUserPromise = undefined;
    this.refreshedTokenPromise = undefined;
    this.refreshBlockedUntil = 0;
    if (this.deployWatcherInstance) {
      this.deployWatcherInstance.stop();
      this.deployWatcherInstance = null;
    }
    return super.logout();
  }

  authComponent() {
    const wrappedAuthenticationPage = (props: Record<string, unknown>) => {
      const allProps = { ...props, backend: this };
      return <SupabaseAuthenticationPage {...allProps} />;
    };
    wrappedAuthenticationPage.displayName = 'AuthenticationPage';
    return wrappedAuthenticationPage;
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

  async authenticate(state: Credentials) {
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

    const supabaseState = state as SupabaseUser;
    this.supabaseIdentity = supabaseState;
    const activeSiteFromState = supabaseState.user_metadata?.active_site_id;
    if (this.siteId && this.supabaseAccessToken && activeSiteFromState !== this.siteId) {
      await this.setActiveSiteAndRefresh();
    }

    this.token = state.token as string;

    if (!this.isBranchConfigured) {
      const repoInfo = await this.ghFetch(`${this.apiRoot}/repos/${this.originRepo}`)
        .then(res => res.json())
        .catch(() => null);
      if (repoInfo && repoInfo.default_branch) {
        this.branch = repoInfo.default_branch;
      }
    }

    // TurboAPI in place of decap-cms-backend-github's API: it commits through
    // `_content/commit` (one request instead of N+4) and falls back to the
    // inherited REST sequence for renames, editorial workflow, oversized
    // payloads, and edge functions that predate the endpoint. See
    // decap-turbo/docs/deploy-status-plan.md §B1.
    const apiCtor = this.useGraphql ? GraphQLAPI : TurboAPI;
    this.api = new apiCtor({
      // Bound so the commit request inherits the session refresh, the
      // x-site-id scoping and the save meter that every other Turbo request
      // already goes through.
      turboFetch: this.ghFetch.bind(this),
      token: this.token,
      tokenKeyword: this.tokenKeyword,
      branch: this.branch,
      repo: this.repo,
      originRepo: this.originRepo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      useOpenAuthoring: this.useOpenAuthoring,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
      baseUrl: this.baseUrl,
      getUser: this.currentUser.bind(this),
    });
    this.setScopedApiRequestBuilder();

    // GitHubBackend.authenticate calls `api.hasWriteAccess()` here, which is a
    // `GET /repos/{owner}/{repo}` read of `permissions.push` for the signed-in
    // GitHub user. Turbo has no signed-in GitHub user: it commits with the
    // organization's App installation token, which is exactly why
    // `bypassWriteAccessCheckForAppTokens` is set in the constructor — the
    // answer was already being thrown away. `fetchTurboPermissions` below is
    // what actually decides what this editor may touch.
    //
    // So it was a round trip whose result nothing read, sitting on the critical
    // path of every CMS load, ahead of the first content request: measured at
    // 1.8s through the gh proxy on the tester site. Its other upstream side
    // effect — normalising `repoOwner` to GitHub's casing — Turbo does not need
    // either, because `preloadConfig` takes repo from the authoritative `sites`
    // row rather than from a hand-written config.yml.
    //
    // `currentUser` is local (session identity, no fetch), so pairing it with
    // the permissions read costs nothing and overlaps their latency.
    //
    // Permissions are only knowable post-auth (the `config` bootstrap
    // endpoint's static preloadConfig hook runs before a user JWT exists), so
    // they are fetched here and attached to the returned user rather than
    // resolved earlier. decap-cms-core's actions/auth.ts picks `permissions`
    // up off this object generically (the field name is backend-neutral by
    // design — any backend could set it) and re-filters the loaded config
    // against it.
    const [user, turboPermissions] = await Promise.all([
      this.api!.user(),
      this.fetchTurboPermissions(),
    ]);

    const commitAuthor = resolveCommitAuthorFromSupabaseUser(
      state as SupabaseUser,
      this.commitAuthorEmailFallback,
    );
    this.api!.commitAuthor = commitAuthor;
    this.commitAuthorEmail = commitAuthor?.email;

    recordCmsEvent(
      this.baseUrl!,
      this.supabaseAnonKey,
      this.supabaseAccessToken,
      'cms_session_started',
      this.siteId,
    );

    // Include access_token in the returned user object so it gets stored in auth store
    return {
      ...user,
      // API.user() narrows currentUser's result to { name, login, email } and
      // drops the avatar — but this object is what core stores and the header
      // renders, so put it back.
      avatar_url: this.sessionIdentity().avatarUrl,
      token: state.token as string,
      useOpenAuthoring: this.useOpenAuthoring,
      ...('access_token' in state && { access_token: state.access_token }),
      ...('refresh_token' in state && { refresh_token: state.refresh_token }),
      ...('expires_at' in state && { expires_at: state.expires_at }),
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

    try {
      const res = await fetch(
        `${this.baseUrl}/functions/v1/permissions?site_id=${encodeURIComponent(this.siteId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.supabaseAccessToken}`,
            apikey: this.supabaseAnonKey,
          },
        },
      );
      if (!res.ok) {
        console.warn('Failed to fetch Turbo site permissions', res.status);
        return undefined;
      }
      return await res.json();
    } catch (error) {
      console.warn('Failed to fetch Turbo site permissions', error);
      return undefined;
    }
  }

  async pollUntilForkExists({ repo }: { repo: string; token: string }) {
    const pollDelay = 250;
    let repoExists = false;
    while (!repoExists) {
      repoExists = await this.ghFetch(`${this.apiRoot}/repos/${repo}`)
        .then(() => true)
        .catch(err => {
          if (err && err.status === 404) {
            return false;
          } else {
            return Promise.reject(err);
          }
        });
      if (!repoExists) {
        await new Promise(resolve => setTimeout(resolve, pollDelay));
      }
    }
    return Promise.resolve();
  }

  async userIsOriginMaintainer({ username: usernameArg }: { username?: string; token: string }) {
    const username = usernameArg || (await this.currentUser({ token: this.token || '' })).login;
    this._userIsOriginMaintainerPromises = this._userIsOriginMaintainerPromises || {};
    if (!this._userIsOriginMaintainerPromises[username]) {
      this._userIsOriginMaintainerPromises[username] = this.ghFetch(
        `${this.apiRoot}/repos/${this.originRepo}/collaborators/${username}/permission`,
      )
        .then(res => res.json())
        .then(({ permission }) => permission === 'admin' || permission === 'write');
    }
    return this._userIsOriginMaintainerPromises[username];
  }

  async forkExists({ token }: { token: string }) {
    try {
      const currentUser = await this.currentUser({ token });
      const repoName = this.originRepo.split('/')[1];
      const repo = await this.ghFetch(`${this.apiRoot}/repos/${currentUser.login}/${repoName}`, {
        method: 'GET',
      }).then(res => res.json());

      const forkExists =
        repo.fork === true &&
        repo.parent &&
        repo.parent.full_name.toLowerCase() === this.originRepo.toLowerCase();
      return forkExists;
    } catch {
      return false;
    }
  }

  async authenticateWithFork({
    userData,
    getPermissionToFork,
  }: {
    userData: User;
    getPermissionToFork: () => Promise<boolean> | boolean;
  }) {
    if (!this.openAuthoringEnabled) {
      throw new Error('Cannot authenticate with fork; Open Authoring is turned off.');
    }

    const token = userData.token as string;
    this.token = token;

    if (!this.alwaysForkEnabled && (await this.userIsOriginMaintainer({ token }))) {
      this.repo = this.originRepo;
      this.useOpenAuthoring = false;
      return Promise.resolve();
    }

    const currentUser = await this.currentUser({ token });
    const repoName = this.originRepo.split('/')[1];
    this.repo = `${currentUser.login}/${repoName}`;
    this.useOpenAuthoring = true;

    if (await this.forkExists({ token })) {
      return this.ghFetch(`${this.apiRoot}/repos/${this.repo}/merge-upstream`, {
        method: 'POST',
        body: JSON.stringify({
          branch: this.branch,
        }),
      });
    } else {
      await getPermissionToFork();

      const fork = await this.ghFetch(`${this.apiRoot}/repos/${this.originRepo}/forks`, {
        method: 'POST',
      }).then(res => res.json());
      return this.pollUntilForkExists({ repo: fork.full_name, token });
    }
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
      throw new Error('Session expired. Please log in again.');
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
    // ANY 400 from the refresh grant is terminal. GoTrue answers a refresh it
    // cannot honour with 400 and one of several codes — `refresh_token_not_
    // found`, `refresh_token_already_used`, `invalid_grant`,
    // `invalid_refresh_token`, `session_not_found`, `session_expired` — and
    // every one of them means this token will never work again, so there is
    // nothing a retry can achieve.
    //
    // Matching an allow-list of two of those codes is what made a dead session
    // look transient: a real `refresh_token_not_found` was classified
    // non-terminal, so it was retried three times, swallowed by
    // refreshSessionIfNeeded, and the caller went on to use the EXPIRED access
    // token. Every request then 401'd as "Failed to load entry: Unauthorized"
    // and every one of them started the cycle again — 87 refresh POSTs in 41
    // seconds on a single collection load, until GoTrue's own rate limiter
    // started answering 429 and the session could never recover. Failing
    // closed here is what turns that into one honest "Session expired. Please
    // log in again."
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

  async getRefreshedAccessToken(): Promise<string> {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }
    this.refreshedTokenPromise = (async () => {
      let lastError: SupabaseRefreshError | undefined;

      for (let attempt = 1; attempt <= REFRESH_RETRY_ATTEMPTS; attempt++) {
        try {
          const data = await this.fetchSupabaseRefreshToken();

          this.supabaseAccessToken = data.access_token;
          this.supabaseRefreshToken = data.refresh_token;
          this.supabaseExpiresAt = data.expires_at;
          this.supabase.setAccessToken(this.supabaseAccessToken);
          this.token = data.access_token;
          if (this.api) {
            this.api.token = data.access_token;
          }
          this._currentUserPromise = undefined;
          this.refreshBlockedUntil = 0;

          this.updateUserCredentials({
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
    })()
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

  shouldForceLogoutOnRefreshFailure(error: unknown) {
    const refreshError = error as SupabaseRefreshError;
    return Boolean(refreshError?.isTerminal);
  }

  getRefreshFailureMessage(error: unknown) {
    if (this.shouldForceLogoutOnRefreshFailure(error)) {
      return 'Session expired. Please log in again.';
    }
    if (this.isOffline()) {
      return 'Unable to refresh session while offline. Please reconnect and retry.';
    }
    return 'Unable to refresh session right now. Please retry in a moment.';
  }

  async refreshSessionIfNeeded() {
    const now = Math.floor(Date.now() / 1000);
    if (!this.supabaseExpiresAt || this.supabaseExpiresAt - now >= REFRESH_BUFFER_SECONDS) {
      return;
    }

    // A refresh that just failed for a reason we decided NOT to log out over
    // (offline, 5xx, a rate limit) is not worth re-attempting once per
    // request. `refreshedTokenPromise` only dedupes refreshes that overlap in
    // flight; a collection load fires its entries sequentially, so each one
    // would start a fresh three-attempt cycle against an endpoint that is
    // already failing — which is how a rate limit gets held open indefinitely
    // instead of draining.
    if (Date.now() < this.refreshBlockedUntil) {
      return;
    }

    try {
      await this.getRefreshedAccessToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      if (this.shouldForceLogoutOnRefreshFailure(error)) {
        this.logout();
        throw new Error(this.getRefreshFailureMessage(error));
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
   * from the repo. Until this existed the header could only name the org,
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

  async currentUser({ token }: { token: string }): Promise<GitHubUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = (async () => {
        await this.refreshSessionIfNeeded();

        const owner = this.originRepo.split('/')[0];
        const identity = this.sessionIdentity();

        // `login` stays the repo owner: other GitHub code paths treat it as an
        // identifier (fork lookups, unpublished-entry authors), not as a
        // display name. `name`, `email` and the avatar are the human-facing
        // fields, and they now name the person rather than the org.
        return {
          name: identity.name || owner,
          login: owner,
          email: identity.email,
          avatar_url: identity.avatarUrl,
          token,
          access_token: this.supabaseAccessToken || undefined,
          refresh_token: this.supabaseRefreshToken || undefined,
          expires_at: this.supabaseExpiresAt || undefined,
        } as any as GitHubUser;
      })() as any;
    }
    return this._currentUserPromise!;
  }

  /**
   * Reads one entry, verifying the cached row is current before trusting it.
   *
   * The check is not cosmetic. Collection loads revalidate the branch head on
   * every sync, but this path is reached directly — core's loadEntry when an
   * editor deep-links to an entry, and once per non-default locale for
   * multiple_files/multiple_folders i18n — so without it the cache is trusted
   * unconditionally.
   *
   * A stale read here is a lost update, not just stale display: persistFiles
   * rebases onto the branch's current head and rewrites the edited path, so
   * saving stale content is a fast-forward commit that silently reverts
   * whoever committed in between.
   *
   * Server-side this costs one conditional request against the shared
   * per-branch ETag. A negative answer falls through to GitHubBackend.getEntry,
   * which reads the file straight from GitHub.
   */
  async getEntry(path: string) {
    const cached = await this.supabase.fetchEntryByPath(path);
    if (!cached) {
      return super.getEntry(path);
    }

    try {
      const response = await this.ghFetch(`${this.apiRoot}/_content/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, branch: this.branch }),
      });
      const { fresh } = await response.json();
      if (fresh) {
        return cached;
      }
    } catch (error) {
      // Falling through to GitHub on an unreachable check is the safe
      // direction: it costs requests, where trusting the cache costs edits.
      console.warn('Turbo entry freshness check failed, reading from GitHub', error);
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

    // Assigned on every save, including to null: only the one-call commit
    // endpoint (§B1) returns a sha, and leaving the previous one in place
    // would have a REST-fallback save watch the deploy of the save before it.
    //
    // The branch has to match too. An editorial-workflow save commits to the
    // entry's own `cms/...` branch, and that commit will never appear in a
    // deploy of the site's branch — so watching it would leave the editor
    // waiting on a deploy that is never coming. An unpublished entry is not
    // going live, and "Entry saved" is the honest thing to say about it.
    const sha = (result as { sha?: unknown } | undefined)?.sha;
    const committedBranch = (result as { branch?: unknown } | undefined)?.branch;
    this.lastSavedCommit =
      typeof sha === 'string' && sha && committedBranch === this.branch
        ? { sha, entryPath: entry.dataFiles?.[0]?.path as string | undefined }
        : null;

    if (result && entry.dataFiles && entry.dataFiles.length > 0) {
      // Deliberately does not write the cache. The commit moves the branch
      // HEAD, and `reloadEntriesAfterPersist` makes core re-run loadEntries
      // immediately after a save, so the very next allEntriesByFolder syncs
      // against the new HEAD and materialises the saved entry server-side.
      // Writing from here cannot work anyway: core's dataFiles carry no `id`,
      // so any row written would keep its pre-save blob sha.
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
          branch: this.branch,
          // Redundant with the server-derived user_id (from the auth JWT) —
          // a fallback for the activity feed when that lookup misses.
          authorEmail: this.commitAuthorEmail,
          // Baseline for the one-call commit endpoint (decap-turbo
          // docs/deploy-status-plan.md B5 -> B1). `requests` is the headline
          // — one save is N+4 round trips today — and durationMs minus
          // upstreamMs is the share of the wait that collapsing them removes.
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
   * Whether `head` contains `base` — the question "is my change in this
   * deploy?", asked of git rather than of two clocks. See
   * decap-turbo/docs/deploy-status-plan.md §A4b.
   *
   * Only reached when a successful deploy names a commit that is not one of
   * ours, which is exactly the case where a host cancelled our build in
   * favour of a newer commit and shipped our change inside it.
   */
  private async isCommitContained(base: string, head: string) {
    const response = await this.ghFetch(
      `${this.apiRoot}/repos/${this.originRepo}/compare/${encodeURIComponent(
        base,
      )}...${encodeURIComponent(head)}`,
    );
    const comparison = (await response.json()) as { status?: string };
    return comparison.status === 'ahead' || comparison.status === 'identical';
  }

  /**
   * The site's deploy watcher, or null when this backend cannot read
   * deployments at all (no Supabase project or site id configured).
   *
   * Built once and shared: it holds one ledger of this editor's unpublished
   * saves for the whole session, not one watch per save.
   */
  private deployWatcher(): DeployWatcher | null {
    const baseUrl = this.baseUrl || (this.supabaseId && `https://${this.supabaseId}.supabase.co`);
    if (!baseUrl || !this.siteId || !this.supabaseAnonKey) {
      return null;
    }

    if (!this.deployWatcherInstance) {
      this.deployWatcherInstance = createDeployWatcher({
        baseUrl,
        anonKey: this.supabaseAnonKey,
        siteId: this.siteId,
        branch: this.branch,
        // A watch outlives several session refreshes, so the token is read per
        // request rather than captured here.
        getAccessToken: () => this.supabaseAccessToken,
        isCommitContained: (base, head) => this.isCommitContained(base, head),
      });
    }

    return this.deployWatcherInstance;
  }

  /**
   * Subscribes to "this change is live / this build failed" for the whole
   * session, and resumes any ledger left over from a previous page load.
   *
   * Returns an unsubscribe function, or null when this backend cannot watch
   * deploys — the caller's cue that no deploy notification will ever arrive.
   */
  subscribeDeployResolutions(
    listener: (resolution: DeployResolution) => void,
  ): (() => void) | null {
    if (!this.deployStatusOptions.notifications) {
      return null;
    }
    return this.deployWatcher()?.subscribe(listener) ?? null;
  }

  /** What the header pill renders. Never starts a poll — see §A8. */
  subscribeDeployStatus(listener: (status: WatchStatus) => void): (() => void) | null {
    if (!this.deployStatusOptions.enabled) {
      return null;
    }
    return this.deployWatcher()?.subscribeStatus(listener) ?? null;
  }

  deployStatusConfig(): DeployStatusConfig {
    // The branch travels with the options so core can scope "Live" without
    // knowing anything about Turbo — it is the same duck-typed contract the
    // rest of this feature uses.
    return { ...this.deployStatusOptions, branch: this.branch ?? null };
  }

  /**
   * Reads the site's recent deploys — the Deploys page, and the single read
   * the app makes on mount so an editor who has saved nothing still sees
   * whether the site is live or broken.
   *
   * Rows are handed to the watcher as well as returned, so the pill and the
   * page cannot disagree about what the latest deploy was.
   */
  async listDeployments(limit?: number): Promise<DeploymentRow[]> {
    const baseUrl = this.baseUrl || (this.supabaseId && `https://${this.supabaseId}.supabase.co`);
    if (!this.deployStatusOptions.enabled || !baseUrl || !this.siteId || !this.supabaseAnonKey) {
      return [];
    }

    const rows = await createDeploymentLister({
      baseUrl,
      anonKey: this.supabaseAnonKey,
      siteId: this.siteId,
      branch: this.branch,
      getAccessToken: () => this.supabaseAccessToken,
    })(limit);

    this.deployWatcher()?.observe(rows);
    return rows;
  }

  /**
   * Recent CMS saves, so the Deploys page can name the entry a deploy carried
   * instead of showing a bare sha. Shared across editors and devices, unlike
   * the watcher's ledger.
   */
  async listCommits(limit?: number): Promise<CommitRow[]> {
    const baseUrl = this.baseUrl || (this.supabaseId && `https://${this.supabaseId}.supabase.co`);
    if (!this.deployStatusOptions.enabled || !baseUrl || !this.siteId || !this.supabaseAnonKey) {
      return [];
    }

    return createCommitLister({
      baseUrl,
      anonKey: this.supabaseAnonKey,
      siteId: this.siteId,
      branch: this.branch,
      getAccessToken: () => this.supabaseAccessToken,
    })(limit);
  }

  /**
   * Records the save just made, so the deploy that carries it can be reported.
   *
   * Returns false when there is nothing to record — no commit sha (the REST
   * fallback path) or a backend that cannot read deployments. That is the
   * caller's cue to leave today's plain "Entry saved" in place, and it is the
   * common case: most sites never produce a deploy row at all (§A0).
   */
  recordSaveForDeployWatch(entryLabel?: string, entryUrlPath?: string): boolean {
    const saved = this.lastSavedCommit;
    const watcher = this.deployWatcher();

    if (!saved || !saved.entryPath || !watcher) {
      return false;
    }

    watcher.record({
      entryPath: saved.entryPath,
      entryLabel,
      entryUrlPath,
      commitSha: saved.sha,
    });
    return true;
  }

  /**
   * Where a commit can be read by a human.
   *
   * The Deploys page shows a short sha, and a sha that links to the deployed
   * site is worse than no link at all — it looks like it will show you the
   * change and shows you the home page. This is the honest destination.
   *
   * `apiRoot` is Turbo's edge function rather than GitHub, so it cannot be
   * derived from there; this backend is github.com-only (Enterprise is not
   * supported), so the host is fixed.
   */
  commitUrl(sha: string): string | null {
    if (!sha || !this.originRepo) {
      return null;
    }
    return `https://github.com/${this.originRepo}/commit/${sha}`;
  }

  /**
   * Asks Turbo to make the cache correct for this collection as of the
   * branch's current HEAD. The server owns tree reading, blob fetching and
   * materialisation; this call is the only thing standing between the client
   * and a plain PostgREST read.
   */
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
      // Sent as source + flags rather than a stringified literal so the server
      // can rebuild the exact RegExp without parsing `/.../flags`.
      ...(pathRegex && { pathRegexSource: pathRegex.source, pathRegexFlags: pathRegex.flags }),
    });
  }

  async postCollectionSync(collection: Record<string, unknown>) {
    const response = await this.ghFetch(`${this.apiRoot}/_content/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, branch: this.branch }),
    });
    const result = await response.json();

    // The server declines to fan out when the organization's GitHub budget is
    // near its floor, so an editor's own requests keep working. The read below
    // still happens and serves whatever is cached — the same outcome as losing
    // the single-flight race — but a silently short collection is worth saying
    // out loud, because otherwise the only symptom is missing entries.
    if (result?.deferred) {
      console.warn(
        `Turbo deferred the sync for "${collection.name}": the GitHub API budget is low ` +
          `(${result.rate_limited?.remaining} left). Showing cached content; it will catch up ` +
          'once the budget recovers.',
      );
    }

    return result;
  }

  /**
   * Files collections (`type: files` in config.yml) were the last read path
   * still going straight to GitHub: GitHubBackend.entriesByFiles fetches a blob
   * AND a commits lookup per file on every single load, with no cache at all.
   * Across the live beta that is 77 configured file paths, so ~154 GitHub
   * requests per full CMS load, forever.
   *
   * They share the whole sync pipeline with folder collections — tree read,
   * sha-addressed blob store, batched metadata, atomic reconcile,
   * single-flight — differing only in how paths are selected, so the server
   * takes an explicit path list instead of a folder selector.
   */
  async entriesByFiles(files: { path: string; label?: string }[]) {
    const paths = files.map(file => file.path);
    if (paths.length === 0) {
      return [];
    }

    const collection = collectionKeyForFiles(paths);
    await this.postCollectionSync({ name: collection, files: paths });

    const entries = await this.supabase.fetchEntries(collection);
    const byPath = new Map(entries.map(entry => [String(entry.file?.path), entry]));

    // Every configured file must produce an entry, including ones that do not
    // exist in the repo yet. A files collection is a fixed list of documents
    // the editor declared, and an entry that has never been saved is how you
    // create it — dropping it removes the only way to add the file at all.
    // GitHubBackend.entriesByFiles gets this for free by catching the read
    // error and yielding empty content; syncing from a tree has to reinstate
    // it explicitly, because a path with no blob simply is not in the tree.
    //
    // Order follows the config, not the path: for a files collection that
    // ordering is the author's choice, not an accident of the filesystem.
    return files.map(file => byPath.get(file.path) ?? { file: { ...file, id: null }, data: '' });
  }

  /**
   * Caches the i18n locale files the collection listing leaves out.
   *
   * `collectionRegex` narrows a listing to the default locale — one card per
   * entry is what a list wants — so with `structure: multiple_files` only
   * `slug.en.md` was ever ingested. The editor reads every locale as its own
   * file, so `slug.de.md` and `slug.si.md` missed the cache on every open and
   * fell through to GitHub: a tree read plus a blob read per locale, measured
   * at ~800ms of an entry open that otherwise cost ~1s.
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
    // it optimises reads from GitHub perfectly well without it.
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

    // One request, in place of a tree listing plus two GitHub calls per entry
    // driven from the browser — which cost 2,001 requests for a 1,000-entry
    // collection, against an installation budget of 5,000/hour.
    //
    // Started alongside the cache read rather than awaited before it. The sync
    // costs 1.4s even when it has nothing to do — it revalidates the branch
    // head through the proxy, which charges a fixed preamble per request —
    // while the read itself is ~300ms, so waiting for one before starting the
    // other spent the read's whole duration for nothing on every warm load.
    const syncPromise = this.syncCollection(collection, folder, extension, depth, pathRegex);

    // Speculative, and its failure is swallowed to `null` here: a read issued
    // before the sync answered must never be the reason a load fails, because
    // the authoritative read below would have served it. Handling it inline
    // also keeps it from ever becoming an unhandled rejection on the branch
    // that discards it.
    const speculativeRead = this.supabase
      .fetchEntries(collection, searchTerm)
      .then(rows => rows, () => null);

    const sync = await syncPromise;

    // `fresh` means the branch head already matched the ingested sha and no
    // row was missing metadata — the server wrote nothing, so the concurrent
    // read cannot have missed anything. Anything else (a sync that ingested,
    // a deferred sync) means the read may predate a write, so it is discarded
    // and the collection is read again. Correctness first; the saved round
    // trip is only ever claimed when the server says nothing changed.
    const entries =
      (sync?.fresh ? await speculativeRead : null) ??
      (await this.supabase.fetchEntries(collection, searchTerm));

    // The client no longer fetches a tree, so sort by path here to keep entry
    // order stable across loads. Path order is what the tree gave anyway —
    // GitHub returns tree entries sorted by path.
    entries.sort((a, b) => String(a.file?.path ?? '').localeCompare(String(b.file?.path ?? '')));

    return entries;
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    return this.allEntriesByFolder(folder, extension, depth);
  }
}
