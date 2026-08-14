import { resolveCommitAuthorFromSupabaseUser } from '../commitAuthor';

describe('resolveCommitAuthorFromSupabaseUser', () => {
  it('uses Supabase user display name and email when available', () => {
    expect(
      resolveCommitAuthorFromSupabaseUser({
        user_name: 'Marta Editor',
        user_email: 'marta@example.com',
      }),
    ).toEqual({
      name: 'Marta Editor',
      email: 'marta@example.com',
    });
  });

  it('falls back to email local-part when display name is missing', () => {
    expect(
      resolveCommitAuthorFromSupabaseUser({
        user_email: 'john.doe@example.com',
      }),
    ).toEqual({
      name: 'john.doe',
      email: 'john.doe@example.com',
    });
  });

  it('uses configured email fallback when user email is missing', () => {
    expect(resolveCommitAuthorFromSupabaseUser({}, 'noreply@example.com')).toEqual({
      name: 'noreply',
      email: 'noreply@example.com',
    });
  });

  it('returns undefined when no email source exists', () => {
    expect(resolveCommitAuthorFromSupabaseUser({ user_name: 'Missing Email' })).toBeUndefined();
  });
});
