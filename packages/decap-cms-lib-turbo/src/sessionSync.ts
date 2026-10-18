/**
 * Keeps one Turbo session usable from every tab of a CMS. Supabase refresh
 * tokens are single-use, so a tab refreshing with a token another tab already
 * spent is logged out. Refreshes take a lock shared by every tab, and the tab
 * that gets it adopts a pair another tab rotated (`adoptRotatedSession`).
 */

const REFRESH_LOCK_NAME = 'decap-turbo-session-refresh';

/** How long to wait for another tab's refresh, so a hung tab cannot block the rest. */
const REFRESH_LOCK_WAIT_MS = 15_000;

/**
 * Runs `refresh` under a lock shared by every tab on this origin, or unguarded
 * without the Web Locks API or once the wait times out.
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

function claimsOf(accessToken: string | null | undefined): Record<string, unknown> | null {
  const payload = accessToken?.split('.')[1];
  if (!payload) return null;
  try {
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/** Which `auth.sessions` row the token belongs to. */
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
 * Ends this one Supabase session server-side (`scope=local`), with `keepalive`
 * so a logout that navigates away still sends it.
 */
export function revokeSession(authUrl: string, anonKey: string, accessToken: string) {
  fetch(`${authUrl}/logout?scope=local`, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined);
}
