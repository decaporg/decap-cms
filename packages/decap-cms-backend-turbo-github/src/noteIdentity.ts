/**
 * Who a note is attributed to on a Turbo backend.
 *
 * NOTE: byte-for-byte the same as decap-cms-backend-turbo-gitlab's copy;
 * changes here must be mirrored, like supabase.ts and commitAuthor.ts.
 *
 * Turbo writes every comment with the organization's shared credential - a
 * GitHub App installation token or a GitLab group token - so the account the
 * host reports as the comment's author is the same bot for every editor. The
 * note body therefore has to carry who actually wrote it, which is what
 * lib-util's `author` / `authorId` marker fields are for.
 *
 * The id is the Supabase user id, read from the `sub` claim of the access
 * token the session already holds. It is stable across a change of display
 * name or email, opaque enough to sit in a public repository's issue comment,
 * and costs no request - unlike the `/gh/user` and `/gl/user` proxy routes,
 * whose id is a 32-bit hash of this same uuid and so can collide.
 */

/**
 * Base64url, and without the padding a JWT segment omits.
 *
 * `atob` reads the bytes as Latin-1, so a claim carrying a non-ASCII display
 * name comes back as mojibake. That is fine for the one claim read here: a
 * Supabase user id is a uuid, and every byte UTF-8 uses for the rest is above
 * 0x7F, where no JSON syntax character lives - so the payload still parses and
 * `sub` still arrives intact.
 */
function decodeSegment(segment: string) {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
}

/**
 * The `sub` claim, or undefined for anything that is not a JWT carrying one.
 *
 * Deliberately does not verify the signature: this picks which notes offer
 * Edit, Resolve and Delete in one editor's own browser. The token was minted
 * by Supabase for this session, and a forged one buys nothing - every write it
 * would enable is checked again server-side against the caller's real identity.
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
