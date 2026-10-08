/**
 * Keeps one Turbo session usable from every tab of a CMS.
 *
 * Supabase refresh tokens are single-use. Every tab restores the same stored
 * session, but each holds its own in-memory copy of the refresh token, so the
 * first tab to refresh spends the token every other tab is holding. The next
 * tab to refresh got `refresh_token_already_used`, which is terminal, and the
 * editor was logged out of a session that was still alive one tab over.
 *
 * Two things fix that. Refreshes take a lock shared by every tab on the
 * origin, so they happen one at a time. And a tab that gets the lock first
 * checks whether the stored session has already been rotated by a tab that
 * held the lock before it, and adopts that pair instead of spending a dead
 * token (see `adoptRotatedSession` in implementation.tsx).
 *
 * NOTE: mirrored in decap-cms-backend-turbo-gitlab, for the same reason
 * `supabase.ts` is — see that file's header.
 */

const REFRESH_LOCK_NAME = 'decap-turbo-session-refresh';

/**
 * How long a tab waits for another tab's refresh before refreshing anyway. A
 * refresh is one request, so this is only reached if the holder hangs, and a
 * hung tab must not leave every other tab unable to refresh.
 */
const REFRESH_LOCK_WAIT_MS = 15_000;

/**
 * Runs `refresh` while holding a lock shared by every tab on this origin.
 * Without the Web Locks API (an insecure origin, an old browser), or if the
 * wait times out, it runs unguarded, which is how every refresh used to run.
 */
export async function withRefreshLock<T>(refresh: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks?.request) {
    return refresh();
  }

  const signal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(REFRESH_LOCK_WAIT_MS)
      : undefined;

  let ran = false;
  try {
    return await locks.request(REFRESH_LOCK_NAME, signal ? { signal } : {}, () => {
      ran = true;
      return refresh();
    });
  } catch (error) {
    // Only a lock that was never granted falls through; a refresh that ran
    // and failed must surface its own error, not run a second time.
    if (ran) throw error;
    return refresh();
  }
}

/**
 * The `session_id` claim of a Supabase access token: which `auth.sessions` row
 * it belongs to. Null when the token is missing or unreadable.
 */
function claimsOf(accessToken: string | null | undefined): Record<string, unknown> | null {
  const payload = accessToken?.split('.')[1];
  if (!payload) return null;
  try {
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function sessionIdOf(accessToken: string | null | undefined): string | null {
  const claims = claimsOf(accessToken);
  return typeof claims?.session_id === 'string' ? claims.session_id : null;
}

/** The token's own `exp`, in epoch seconds, for a stored user saved without `expires_at`. */
export function expiresAtOf(accessToken: string | null | undefined): number | null {
  const claims = claimsOf(accessToken);
  return typeof claims?.exp === 'number' ? claims.exp : null;
}

/**
 * Ends one Supabase session server-side (`scope=local`: this session only, not
 * the user's others). Fire-and-forget with `keepalive`, so a logout that
 * navigates away still sends it, and a failure only leaves behind a session
 * nothing holds any more.
 */
export function revokeSession(authUrl: string, anonKey: string, accessToken: string) {
  fetch(`${authUrl}/logout?scope=local`, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined);
}
