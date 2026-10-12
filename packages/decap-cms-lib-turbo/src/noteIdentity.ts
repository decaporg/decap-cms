/**
 * Who a note is attributed to on a Turbo backend. Turbo writes every comment
 * with the organization's credential, so the note body carries the author: the
 * Supabase user id from the access token's `sub` claim. It survives renames and
 * costs no request; the proxy's `/user` ids are a 32-bit hash that can collide.
 */

/**
 * Base64url without padding. `atob` reads Latin-1, so non-ASCII claims come
 * back garbled, but the JSON still parses and `sub` (a uuid) arrives intact.
 */
function decodeSegment(segment: string) {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
}

/**
 * The `sub` claim, or undefined. Unverified on purpose: it only picks which
 * notes offer Edit, Resolve and Delete; every write is checked server-side.
 */
export function supabaseUserIdFromToken(token: string | null | undefined) {
  if (!token) {
    return undefined;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return undefined;
  }

  try {
    const claims = JSON.parse(decodeSegment(segments[1])) as { sub?: unknown };
    return typeof claims.sub === 'string' && claims.sub ? claims.sub : undefined;
  } catch {
    return undefined;
  }
}
