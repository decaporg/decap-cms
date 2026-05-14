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
});
