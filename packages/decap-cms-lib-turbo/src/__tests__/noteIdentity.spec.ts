import { supabaseUserIdFromToken } from '../noteIdentity';

/** Base64url of the UTF-8 bytes, which is what Supabase signs. */
function segment(value: unknown) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function jwt(claims: Record<string, unknown>) {
  return `${segment({ alg: 'HS256' })}.${segment(claims)}.signature`;
}

describe('supabaseUserIdFromToken', () => {
  it('reads the sub claim', () => {
    const id = '3f2b1c4d-0000-4a5b-8c9d-1e2f3a4b5c6d';
    expect(supabaseUserIdFromToken(jwt({ sub: id, email: 'decap@p-m.si' }))).toBe(id);
  });

  it('decodes a payload whose base64url needs padding back', () => {
    // Its own test because a JWT segment carries no `=` padding, and atob
    // rejects a string whose length is not a multiple of four.
    const id = 'a'.repeat(37);
    expect(jwt({ sub: id }).split('.')[1].length % 4).not.toBe(0);
    expect(supabaseUserIdFromToken(jwt({ sub: id }))).toBe(id);
  });

  it('reads the sub past a claim carrying a non-ASCII name', () => {
    // The payload is UTF-8 and `atob` reads Latin-1, so the name comes back as
    // mojibake - which must not stop the uuid beside it from parsing.
    const id = '3f2b1c4d-0000-4a5b-8c9d-1e2f3a4b5c6d';
    expect(supabaseUserIdFromToken(jwt({ sub: id, name: 'Zoë Ⓐ Škofja' }))).toBe(id);
  });

  it.each([
    ['no token', undefined],
    ['an empty token', ''],
    ['something that is not a JWT', 'not-a-jwt'],
    ['a JWT whose payload is not JSON', `${btoa('{}')}.not-json.sig`],
    ['a JWT with no sub', jwt({ email: 'decap@p-m.si' })],
    ['a JWT whose sub is not a string', jwt({ sub: 42 })],
    ['a JWT whose sub is empty', jwt({ sub: '' })],
  ])('answers undefined for %s', (_label, token) => {
    expect(supabaseUserIdFromToken(token as string | undefined)).toBeUndefined();
  });
});
