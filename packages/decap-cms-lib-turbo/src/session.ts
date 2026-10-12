/**
 * The Turbo session a CMS holds: the Supabase tokens, their refresh, and the
 * answers from the proxy that mean the session is over.
 *
 * One instance per backend. The backend keeps the git host's own state (its
 * API client, the token field core reads) and hears about token changes
 * through `onTokensChanged`, so what it derives from the token never goes
 * stale.
 */
import { APIError, type Credentials, type User } from 'decap-cms-lib-util';

import { resolveCommitAuthorFromSupabaseUser } from './commitAuthor';
import { supabaseUserIdFromToken } from './noteIdentity';
import { expiresAtOf, revokeSession, sessionIdOf, withRefreshLock } from './sessionSync';

export interface SupabaseUser extends User {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  /** Set when Turbo minted this session for this CMS alone; see `clear`. */
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

export type SupabaseRefreshError = Error & {
  status?: number;
  code?: string;
  isTerminal?: boolean;
};

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface TurboPermissions {
  collections?: Record<string, string>;
}

export const REFRESH_BUFFER_SECONDS = 300;
export const REFRESH_RETRY_ATTEMPTS = 3;
/** How long to stop retrying after a refresh failed transiently. */
export const REFRESH_COOLDOWN_MS = 30_000;
/**
 * GoTrue refresh-grant failures that mean the token is dead for good. Kept
 * alongside the status check so a code arriving under an unexpected status is
 * still recognised.
 */
export const TERMINAL_REFRESH_CODES = new Set([
  'refresh_token_not_found',
  'refresh_token_already_used',
  'invalid_grant',
  'invalid_refresh_token',
  'session_not_found',
  'session_expired',
]);

export const TURBO_SITE_ACCESS_DENIED_MESSAGE =
  "Your Decap Turbo account doesn't have access to this site. A team owner can add you " +
  "from the site's Members tab in Decap Turbo, then log in again.";

export const SESSION_EXPIRED_MESSAGE = 'Session expired. Please log in again.';

/**
 * The proxy's own refusal of the access token (supabase/functions/gh and gl)
 * is this exact plain-text body. A 401 the git host sent back through the
 * proxy is JSON ("Bad credentials", "401 Unauthorized") and is about the
 * organization's credential, not this session, so it must not log the editor
 * out.
 */
export const PROXY_UNAUTHORIZED_BODY = 'Unauthorized';

/** The proxy's 403 for a user with no membership on this site. */
export const SITE_ACCESS_DENIED_MARKER = 'no access to requested site';

/**
 * Proxy refusals that only an organization owner can fix from the dashboard:
 * no repo on the site, no Git connection, or a repo outside the connection's
 * scope. Retrying cannot help, and every collection load used to ask again
 * (79-129 refused requests a minute from one tab).
 *
 * `github_installation_unavailable` is what the proxy sends for an uninstalled
 * or suspended App; `github_installation_missing` and `gitlab_not_connected`
 * are accepted ahead of the server sending them.
 */
export const TERMINAL_PROXY_CODES = new Set([
  'site_repo_missing',
  'repo_not_in_scope',
  'github_not_connected',
  'github_installation_missing',
  'github_installation_unavailable',
  'gitlab_not_connected',
]);

/** The repo-scope 403, matched on its sentence for proxies that predate `code`. */
export const REPO_SCOPE_MARKER = "is not in this organization's selected repo scope";

/** The proxy's `error` sentence when `body` is one of the refusals above. */
export function terminalProxyRefusal(body: string): string | null {
  let parsed: { error?: unknown; code?: unknown } | null;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof parsed?.error !== 'string') return null;
  const isTerminal =
    TERMINAL_PROXY_CODES.has(String(parsed.code)) || parsed.error.includes(REPO_SCOPE_MARKER);
  return isTerminal ? parsed.error : null;
}

export interface TurboSessionOptions {
  supabaseId: string;
  anonKey: string;
  siteId: string;
  updateUserCredentials?: (credentials: Credentials) => void;
  /** The stored user as another tab may have left it; see `adoptRotatedSession`. */
  retrieveUserCredentials?: () => Credentials | null;
  /** Core's hook for a session that has ended for good; see `invalidate`. */
  onSessionInvalid?: (message: string) => void;
  /**
   * Called with the access token whenever it changes, null included, so the
   * backend can re-point its API client, its content-cache client and
   * whatever else it derives from the token.
   */
  onTokensChanged?: (accessToken: string | null) => void;
  /** The backend's own logout, run when Turbo refuses the session. */
  logout?: () => void;
}

function noop() {
  // The default for every optional hook.
}

export class TurboSession {
  readonly supabaseId: string;
  readonly anonKey: string;
  readonly siteId: string;

  accessToken: string | null = null;
  refreshToken: string | null = null;
  expiresAt: number | null = null;
  /**
   * Whether this CMS owns its Turbo session outright. "Login with Turbo" now
   * hands each CMS a session of its own, but logins from before that, or one
   * where Turbo could not mint one, still share the dashboard's session, and
   * those must never be revoked from here. See `clear`.
   */
  dedicated = false;
  /**
   * The signed-in person, as opposed to the repo being edited: email, display
   * name and (for OAuth sign-ins) avatar, straight off the Turbo session.
   * `sessionIdentity` reports these to the header. Survives a reload because
   * `authenticate` returns the same fields on the stored user object, which
   * `restoreUser` hands straight back. Cleared by `clear`.
   */
  identity: SupabaseUser | null = null;
  /**
   * Set once this session is known to be over, and cleared by the next login.
   * While set, requests fail here without reaching the proxy.
   */
  invalidMessage: string | null = null;
  /** Epoch ms before which refreshIfNeeded will not try again. */
  refreshBlockedUntil = 0;
  refreshedTokenPromise?: Promise<string>;

  private readonly updateUserCredentials: (credentials: Credentials) => void;
  private readonly retrieveUserCredentials: () => Credentials | null;
  private readonly onSessionInvalid: (message: string) => void;
  private readonly onTokensChanged: (accessToken: string | null) => void;
  private readonly hostLogout: () => void;

  constructor(options: TurboSessionOptions) {
    this.supabaseId = options.supabaseId;
    this.anonKey = options.anonKey;
    this.siteId = options.siteId;
    this.updateUserCredentials = options.updateUserCredentials || noop;
    this.retrieveUserCredentials = options.retrieveUserCredentials || (() => null);
    this.onSessionInvalid = options.onSessionInvalid || noop;
    this.onTokensChanged = options.onTokensChanged || noop;
    this.hostLogout = options.logout || noop;
  }

  get authUrl() {
    return `https://${this.supabaseId}.supabase.co/auth/v1`;
  }

  private setAccessToken(accessToken: string | null) {
    this.accessToken = accessToken;
    this.onTokensChanged(accessToken);
  }

  /** Adopts whatever tokens a stored user carries, ahead of `begin`. */
  restore(user: User) {
    const stored = user as SupabaseUser;
    if (stored.access_token) {
      this.setAccessToken(stored.access_token);
    }
    if (stored.refresh_token) {
      this.refreshToken = stored.refresh_token;
    }
    if (stored.expires_at) {
      this.expiresAt = stored.expires_at;
    }
  }

  /**
   * Starts the session from login credentials: the tokens, whether this CMS
   * owns the session, who is signed in, and the site the JWT must name.
   */
  async begin(state: Credentials) {
    this.invalidMessage = null;
    if ('access_token' in state) {
      this.setAccessToken(state.access_token as string);
    }
    if ('refresh_token' in state) {
      this.refreshToken = state.refresh_token as string;
    }
    if ('expires_at' in state) {
      this.expiresAt = state.expires_at as number;
    }
    const supabaseState = state as SupabaseUser;
    this.dedicated = supabaseState.dedicated_session === true;
    this.identity = supabaseState;

    const activeSiteFromState = supabaseState.user_metadata?.active_site_id;
    if (this.siteId && this.accessToken && activeSiteFromState !== this.siteId) {
      await this.setActiveSiteAndRefresh();
    }
  }

  /**
   * The session's share of the user object `authenticate` returns, which core
   * stores and hands back to `restoreUser` on the next load.
   */
  storedUserFields(state: Credentials, permissions?: TurboPermissions) {
    const supabaseState = state as SupabaseUser;
    return {
      token: state.token as string,
      ...('access_token' in state && { access_token: supabaseState.access_token }),
      ...('refresh_token' in state && { refresh_token: supabaseState.refresh_token }),
      ...('expires_at' in state && { expires_at: supabaseState.expires_at }),
      dedicated_session: this.dedicated,
      ...('user_name' in state && { user_name: supabaseState.user_name }),
      ...('user_email' in state && { user_email: supabaseState.user_email }),
      ...('email' in state && { email: supabaseState.email }),
      ...('user_metadata' in state && { user_metadata: supabaseState.user_metadata }),
      // decap-cms-core's actions/auth.ts picks `permissions` up off this
      // object generically (the field name is backend-neutral by design) and
      // re-filters the loaded config against it.
      ...(permissions && { permissions }),
    };
  }

  /**
   * Drops the session on this side, as part of the backend's logout.
   *
   * A dedicated session (one Turbo minted for this CMS alone) is also revoked
   * server-side, so it cannot outlive the logout. A shared one, from a login
   * before Turbo minted per-CMS sessions, is left alone: it is the dashboard's
   * own session, and one site's CMS logout must not sign the user out of the
   * dashboard and every other site's CMS. Signing out of Turbo is the
   * dashboard's own logout button, and that revokes every session, this
   * CMS's included.
   */
  clear() {
    if (this.dedicated && this.accessToken) {
      revokeSession(this.authUrl, this.anonKey, this.accessToken);
    }
    this.dedicated = false;
    this.refreshToken = null;
    this.expiresAt = null;
    this.identity = null;
    this.refreshedTokenPromise = undefined;
    this.refreshBlockedUntil = 0;
    this.setAccessToken(null);
  }

  /** Whether the session can still authenticate requests; the `auth` half of `status()`. */
  async authStatus(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiringSoon = this.expiresAt && this.expiresAt - now <= REFRESH_BUFFER_SECONDS;
      if (expiringSoon && this.refreshToken) {
        try {
          await this.getRefreshedAccessToken();
          return true;
        } catch (error) {
          return !(error as SupabaseRefreshError).isTerminal;
        }
      }
      return !expiringSoon;
    } catch (e) {
      console.warn('Failed checking Supabase auth status', e);
      return false;
    }
  }

  /**
   * Ends a session that cannot recover: logs out once, hands core the reason
   * (it returns to the login page and shows it), and latches, so whatever is
   * still queued behind this request fails in `assertUsable` instead of each
   * going to the proxy for the same answer.
   */
  invalidate(message: string) {
    if (this.invalidMessage) return;
    this.invalidMessage = message;
    this.hostLogout();
    this.onSessionInvalid(message);
  }

  assertUsable() {
    if (this.invalidMessage) {
      throw new APIError(this.invalidMessage, 401, 'Decap Turbo');
    }
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
   * - A 403 for a site the user is no longer a member of, and the refusals in
   *   TERMINAL_PROXY_CODES, cannot be fixed from here at all.
   *
   * Without this a dead session kept a tab looking logged in, and every click
   * cost a request and a toast: 20 refused syncs in 35 s from one editor.
   */
  async reactToProxyAuthAnswer(
    status: number,
    body: string,
    isRetry: boolean,
  ): Promise<'retry' | 'fail'> {
    if (status === 403 && body.includes(SITE_ACCESS_DENIED_MARKER)) {
      this.invalidate(TURBO_SITE_ACCESS_DENIED_MESSAGE);
      return 'fail';
    }
    const refusal = terminalProxyRefusal(body);
    if (refusal) {
      this.invalidate(refusal);
      return 'fail';
    }
    if (status !== 401 || body.trim() !== PROXY_UNAUTHORIZED_BODY) return 'fail';
    if (isRetry || !this.refreshToken) {
      this.invalidate(SESSION_EXPIRED_MESSAGE);
      return 'fail';
    }
    try {
      await this.getRefreshedAccessToken();
      return 'retry';
    } catch (error) {
      if (this.shouldForceLogoutOnRefreshFailure(error)) {
        this.invalidate(this.getRefreshFailureMessage(error));
      }
      return 'fail';
    }
  }

  async setActiveSiteAndRefresh() {
    if (!this.accessToken || !this.siteId) {
      return;
    }

    // Proactive: a restored session's access token is commonly past `exp` by
    // the time this runs (it's checked before any other request), so refresh
    // it first using the same buffer/backoff/terminal-detection every other
    // call site already applies, instead of handing a stale token straight to
    // Supabase.
    await this.refreshIfNeeded();

    const putActiveSiteId = () =>
      fetch(`${this.authUrl}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.anonKey,
          Authorization: `Bearer ${this.accessToken}`,
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

  /**
   * What this editor may touch on this site. Only knowable post-auth (the
   * `config` bootstrap endpoint's static preloadConfig hook runs before a user
   * JWT exists), so `authenticate` fetches it and attaches it to the returned
   * user.
   */
  async fetchPermissions(baseUrl: string): Promise<TurboPermissions | undefined> {
    if (!this.accessToken || !this.siteId) {
      return undefined;
    }

    // Refresh first, like every other call site that sends this token. While
    // this ran after `api.user()` it inherited the refresh `currentUser`
    // performs; running the two concurrently made it read a token that was
    // still expiring, and a 401 here does not fail loudly — it silently drops
    // the editor's collection restrictions. Refreshes are memoised on
    // `refreshedTokenPromise`, so sharing one with `currentUser` costs nothing.
    await this.refreshIfNeeded();

    let res: Response;
    try {
      res = await fetch(
        `${baseUrl}/functions/v1/permissions?site_id=${encodeURIComponent(this.siteId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            apikey: this.anonKey,
          },
        },
      );
    } catch (error) {
      console.warn('Failed to fetch Turbo site permissions', error);
      return undefined;
    }

    // 403 is the one answer that is not a soft failure: the endpoint returns it
    // only when the signed-in user has no membership on this site. Team
    // membership alone is not enough (owners included), and the proxy refuses
    // every request on the same grounds — so letting the login through put the
    // editor in a "logged in" CMS where every collection load raised its own
    // 403 toast. Failing here turns that into a single error on the login
    // page, and on a restored session core logs the user out.
    if (res.status === 403) {
      this.hostLogout();
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
    // refreshIfNeeded, and the caller went on to use the EXPIRED access
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

  async fetchRefreshedTokens(): Promise<SessionTokens> {
    if (!this.refreshToken) {
      const noTokenError = new Error('No refresh token available') as SupabaseRefreshError;
      noTokenError.isTerminal = true;
      throw noTokenError;
    }

    const response = await fetch(`${this.authUrl}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.anonKey,
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    });

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
    this.refreshedTokenPromise = withRefreshLock(async () => {
      // A tab that held the lock before this one may have already spent the
      // refresh token this tab holds. Taking over what it stored is the only
      // way to keep this session, and may make a refresh unnecessary.
      if (this.adoptRotatedSession() && !this.isExpiringSoon()) {
        return this.accessToken as string;
      }

      let lastError: SupabaseRefreshError | undefined;

      for (let attempt = 1; attempt <= REFRESH_RETRY_ATTEMPTS; attempt++) {
        try {
          const data = await this.fetchRefreshedTokens();
          this.useSessionTokens(data);

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

  useSessionTokens(session: SessionTokens) {
    this.refreshToken = session.refresh_token;
    this.expiresAt = session.expires_at;
    this.refreshBlockedUntil = 0;
    this.setAccessToken(session.access_token);
  }

  isExpiringSoon() {
    const now = Math.floor(Date.now() / 1000);
    return !this.expiresAt || this.expiresAt - now < REFRESH_BUFFER_SECONDS;
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
    if (stored.refresh_token === this.refreshToken) return false;
    const ownSessionId = sessionIdOf(this.accessToken);
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

  async refreshIfNeeded() {
    const now = Math.floor(Date.now() / 1000);
    if (!this.expiresAt && this.accessToken) {
      // A stored user saved without `expires_at` used to skip refreshing
      // forever, and its token started failing an hour in.
      this.expiresAt = expiresAtOf(this.accessToken);
    }
    if (!this.expiresAt || this.expiresAt - now >= REFRESH_BUFFER_SECONDS) {
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
        const message = this.getRefreshFailureMessage(error);
        this.invalidate(message);
        throw new Error(message);
      }
      this.refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
    }
  }

  /**
   * Who is signed in, as the CMS header should show them: display name, email
   * and (for OAuth sign-ins) avatar, taken from the Turbo session rather than
   * from the repo. Until this existed the header could only name the org,
   * which made a silent re-login — the Turbo dashboard session outlives a CMS
   * logout by design, so "Login with Turbo" completes without a prompt —
   * indistinguishable from a login as somebody else.
   *
   * Deliberately does not consult the backend's commit-author fallback: a
   * site-level noreply address is a reasonable commit author, but it is not a
   * person who logged in.
   */
  sessionIdentity() {
    const author = resolveCommitAuthorFromSupabaseUser(this.identity ?? {});
    const metadata = this.identity?.user_metadata;
    return {
      name: author?.name,
      email: author?.email,
      avatarUrl: metadata?.avatar_url || metadata?.picture || null,
    };
  }

  /**
   * Who the signed-in editor is, as a note records them.
   *
   * The git host backends read this off the host's user: on GitHub that is
   * `currentUser().login`, the repo owner for every Turbo editor alike; on
   * GitLab it is `api.user()`, which the proxy synthesizes from the email's
   * local part. Either way ownership would match everyone and every note
   * would offer Edit, Resolve and Delete to whoever opened it.
   *
   * Unlike those backends, this one DOES record an id. There the editor posts
   * the comment themselves, so the host reports their current login on every
   * read and ownership follows a rename on its own; here every note is posted
   * by the organization's credential, so the comment says nothing about who
   * wrote it and the note body has to.
   */
  noteAuthorIdentity(): { author: string; authorId?: string } {
    const identity = this.sessionIdentity();
    return {
      author: identity.name || identity.email || '',
      authorId: supabaseUserIdFromToken(this.accessToken),
    };
  }
}
