/**
 * The Turbo session a CMS holds: the Supabase tokens, their refresh, and the
 * proxy answers that end it. The backend hears about token changes through
 * `onTokensChanged`, so what it derives from the token never goes stale.
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
    // OAuth sign-ins only (Google spells it `picture`).
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
/** GoTrue refresh-grant codes that mean the token is dead, whatever the status. */
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
 * The proxy's own refusal of the access token is this exact plain-text body.
 * A 401 the git host sent back through the proxy is JSON and is about the
 * organization's credential, not this session, so it must not log out.
 */
export const PROXY_UNAUTHORIZED_BODY = 'Unauthorized';

/** The proxy's 403 for a user with no membership on this site. */
export const SITE_ACCESS_DENIED_MARKER = 'no access to requested site';

/**
 * Proxy refusals that only an organization owner can fix from the dashboard,
 * so retrying cannot help. `github_installation_missing` and
 * `gitlab_not_connected` are accepted ahead of the server sending them.
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
  /** Every access-token change, null included, so the backend can re-point its clients. */
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
  /** Whether Turbo minted this session for this CMS alone; see `clear`. */
  dedicated = false;
  /** The signed-in person, as opposed to the repo being edited. */
  identity: SupabaseUser | null = null;
  /** Set once the session is over; requests fail here until the next login. */
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

  /** Starts the session from login credentials and points the JWT at this site. */
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

  /** The session's share of the user object core stores and hands back to `restoreUser`. */
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
      // Core re-filters the loaded config against `permissions`.
      ...(permissions && { permissions }),
    };
  }

  /**
   * Drops the session on this side. A dedicated session is also revoked
   * server-side; a shared one (older logins) is the dashboard's own, and one
   * site's CMS logout must not sign the user out of the dashboard.
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
   * Ends a session that cannot recover: logs out once, hands core the reason,
   * and latches, so queued requests fail in `assertUsable` instead of each
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
   * The proxy's "this session cannot continue" answers.
   *
   * - A 401 from the proxy itself means the access token was refused: expired
   *   despite the local clock, or revoked server-side. One forced refresh,
   *   ignoring the cooldown, decides which: a new token is worth one retry, a
   *   terminal refusal ends the session.
   * - A 403 for a site the user is no longer a member of, and the refusals in
   *   TERMINAL_PROXY_CODES, cannot be fixed from here at all.
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

    // A restored session's access token is commonly past `exp` by now.
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
      // No `expires_at`, or a token invalidated after the check above.
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

    // The metadata is already set; this refresh only rolls it into the JWT, so
    // a failure (a refresh token another tab rotated) must not fail the login.
    await this.getRefreshedAccessToken().catch(error => {
      console.warn('Failed to refresh Supabase token after setting active_site_id', error);
    });
  }

  /** What this editor may touch on this site; only knowable once a user JWT exists. */
  async fetchPermissions(baseUrl: string): Promise<TurboPermissions | undefined> {
    if (!this.accessToken || !this.siteId) {
      return undefined;
    }

    // Refresh first: this runs concurrently with `currentUser`, and a 401 here
    // silently drops the editor's collection restrictions.
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

    // 403 means no membership on this site, and the proxy refuses every
    // request on the same grounds: fail the login once instead.
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
    // ANY 400 from the refresh grant is terminal: every code GoTrue sends with
    // it means the token will never work again. Treating some as transient
    // retried a dead session until GoTrue rate-limited it.
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
   * Takes over this session's tokens when another tab of this CMS has rotated
   * them, and returns whether it did. Must run under the refresh lock, or the
   * stored pair can be spent between reading and using it. Only the same
   * session (by `session_id`) is adopted, never a later login.
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
      // Otherwise a stored user without `expires_at` never refreshes.
      this.expiresAt = expiresAtOf(this.accessToken);
    }
    if (!this.expiresAt || this.expiresAt - now >= REFRESH_BUFFER_SECONDS) {
      return;
    }

    // After a non-terminal failure (offline, 5xx, rate limit), don't start a
    // new three-attempt cycle per sequential request: that holds a rate limit open.
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
   * Who is signed in, for the CMS header, from the Turbo session rather than
   * the repo. Ignores the commit-author fallback: a site-level noreply address
   * is not a person who logged in.
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
   * Who the signed-in editor is, as a note records them. The host's user is
   * the same for every Turbo editor, and every note is posted by the
   * organization's credential, so the note body has to carry the id.
   */
  noteAuthorIdentity(): { author: string; authorId?: string } {
    const identity = this.sessionIdentity();
    return {
      author: identity.name || identity.email || '',
      authorId: supabaseUserIdFromToken(this.accessToken),
    };
  }
}
