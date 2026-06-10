import PkceAuthenticator from '../pkce-oauth';

const CODE_VERIFIER_STORAGE_KEY = 'decap-cms-pkce-verifier-code';
const AUTH_NONCE_STORAGE_KEY = 'decap-cms-auth';

function setAuthCallbackUrl(query) {
  window.history.replaceState(null, '', `/${query}`);
}

function setValidNonce(nonce = 'nonce-123') {
  window.sessionStorage.setItem(AUTH_NONCE_STORAGE_KEY, JSON.stringify({ nonce }));
  return nonce;
}

describe('PkceAuthenticator', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    setAuthCallbackUrl('');
  });

  it('should clear code verifier when provider returns an auth error', async () => {
    const nonce = setValidNonce();
    const state = encodeURIComponent(JSON.stringify({ nonce }));
    setAuthCallbackUrl(`?error=access_denied&error_description=Denied&state=${state}`);
    window.sessionStorage.setItem(CODE_VERIFIER_STORAGE_KEY, 'verifier');

    const authenticator = new PkceAuthenticator({
      use_oidc: false,
      base_url: 'https://example.com',
      auth_endpoint: 'authorize',
      auth_token_endpoint: 'oauth/token',
      auth_token_endpoint_content_type: 'application/json',
      app_id: 'app-id',
    });
    const cb = jest.fn();

    await authenticator.completeAuth(cb);

    expect(cb).toHaveBeenCalledWith(new Error('access_denied: Denied'));
    expect(window.sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY)).toBeNull();
  });

  it('should clear code verifier when OIDC config loading fails', async () => {
    const nonce = setValidNonce();
    const state = encodeURIComponent(JSON.stringify({ nonce }));
    setAuthCallbackUrl(`?code=auth-code&state=${state}`);
    window.sessionStorage.setItem(CODE_VERIFIER_STORAGE_KEY, 'verifier');

    const authenticator = new PkceAuthenticator({
      use_oidc: true,
      base_url: 'https://example.com',
    });
    jest.spyOn(authenticator, '_loadOidcConfig').mockRejectedValue(new Error('OIDC failed'));
    const cb = jest.fn();

    await authenticator.completeAuth(cb);

    expect(cb).toHaveBeenCalledWith(new Error('OIDC failed'));
    expect(window.sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY)).toBeNull();
  });

  it('should clear code verifier when nonce validation fails', async () => {
    const expectedNonce = setValidNonce('expected-nonce');
    const state = encodeURIComponent(JSON.stringify({ nonce: `${expectedNonce}-other` }));
    setAuthCallbackUrl(`?code=auth-code&state=${state}`);
    window.sessionStorage.setItem(CODE_VERIFIER_STORAGE_KEY, 'verifier');

    const authenticator = new PkceAuthenticator({
      use_oidc: false,
      base_url: 'https://example.com',
      auth_endpoint: 'authorize',
      auth_token_endpoint: 'oauth/token',
      auth_token_endpoint_content_type: 'application/json',
      app_id: 'app-id',
    });
    const cb = jest.fn();

    await authenticator.completeAuth(cb);

    expect(cb).toHaveBeenCalledWith(new Error('Invalid nonce'));
    expect(window.sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY)).toBeNull();
  });

  describe('refresh', () => {
    function createAuthenticator() {
      return new PkceAuthenticator({
        use_oidc: false,
        base_url: 'https://example.com',
        auth_endpoint: 'authorize',
        auth_token_endpoint: 'oauth/token',
        auth_token_endpoint_content_type: 'application/json',
        app_id: 'app-id',
      });
    }

    afterEach(() => {
      delete global.fetch;
    });

    it('should exchange a refresh token for new credentials', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 7200,
        }),
      });

      const authenticator = createAuthenticator();
      const result = await authenticator.refresh({ refresh_token: 'old-refresh-token' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            client_id: 'app-id',
            grant_type: 'refresh_token',
            refresh_token: 'old-refresh-token',
          }),
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        }),
      );
    });

    it('should send form encoded body when configured', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'new-access-token' }),
      });

      const authenticator = new PkceAuthenticator({
        use_oidc: false,
        base_url: 'https://example.com',
        auth_endpoint: 'authorize',
        auth_token_endpoint: 'oauth/token',
        auth_token_endpoint_content_type: 'application/x-www-form-urlencoded; charset=utf-8',
        app_id: 'app-id',
      });
      await authenticator.refresh({ refresh_token: 'old-refresh-token' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/oauth/token',
        expect.objectContaining({
          body: 'client_id=app-id&grant_type=refresh_token&refresh_token=old-refresh-token',
        }),
      );
    });

    it('should throw when the provider returns an error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Refresh token is invalid',
        }),
      });

      const authenticator = createAuthenticator();

      await expect(authenticator.refresh({ refresh_token: 'expired' })).rejects.toThrow(
        'Refresh token is invalid',
      );
    });

    it('should throw when no refresh token is available', async () => {
      const authenticator = createAuthenticator();

      await expect(authenticator.refresh({})).rejects.toThrow('Missing refresh token');
    });
  });
});
