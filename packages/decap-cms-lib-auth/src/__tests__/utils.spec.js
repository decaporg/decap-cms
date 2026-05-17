import { createNonce, validateNonce } from '../utils';

describe('auth utils', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('should validate and clear nonce from session storage', () => {
    const nonce = createNonce();

    expect(validateNonce(nonce)).toBe(true);
    expect(window.sessionStorage.getItem('decap-cms-auth')).toBeNull();
  });

  it('should not clear local storage nonce key', () => {
    window.localStorage.setItem('decap-cms-auth', 'local-only');
    const nonce = createNonce();

    validateNonce(nonce);

    expect(window.localStorage.getItem('decap-cms-auth')).toBe('local-only');
  });
});
