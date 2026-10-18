import { selectUserIdentity } from '../userHelper';

describe('selectUserIdentity', () => {
  it('returns undefined without a user', () => {
    expect(selectUserIdentity(undefined)).toBeUndefined();
  });

  it('returns undefined when the backend knows neither a name nor an email', () => {
    expect(selectUserIdentity({ token: 'token', name: '' })).toBeUndefined();
  });

  it('shows the name with the email under it', () => {
    expect(
      selectUserIdentity({ token: 'token', name: 'Ed Editor', email: 'editor@example.com' }),
    ).toEqual({ label: 'Ed Editor', email: 'editor@example.com' });
  });

  it('does not repeat the email when it is already the label', () => {
    expect(selectUserIdentity({ token: 'token', name: '', email: 'editor@example.com' })).toEqual({
      label: 'editor@example.com',
    });
  });

  it('falls back to the login when the backend has no name', () => {
    expect(selectUserIdentity({ token: 'token', name: '', login: 'ed' })).toEqual({ label: 'ed' });
  });
});
