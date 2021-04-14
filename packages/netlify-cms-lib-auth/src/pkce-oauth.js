import trim from 'lodash/trim';
import trimEnd from 'lodash/trimEnd';
import { createNonce, validateNonce, isInsecureProtocol } from './utils';

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const sha = String.fromCharCode(...new Uint8Array(digest));
  return sha;
}

// based on https://github.com/auth0/auth0-spa-js/blob/9a83f698127eae7da72691b0d4b1b847567687e3/src/utils.ts#L147
function generateVerifierCode() {
  // characters that can be used for codeVerifer
  // excludes _~ as if included would cause an uneven distribution as char.length would no longer be a factor of 256
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.';
  const randomValues = Array.from(window.crypto.getRandomValues(new Uint8Array(128)));
  return randomValues
    .map(val => {
      return chars[val % chars.length];
    })
    .join('');
}

async function createCodeChallenge(codeVerifier) {
  const sha = await sha256(codeVerifier);
  // https://tools.ietf.org/html/rfc7636#appendix-A
  return btoa(sha)
    .split('=')[0]
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const CODE_VERIFIER_STORAGE_KEY = 'netlify-cms-pkce-verifier-code';

function createCodeVerifier() {
  const codeVerifier = generateVerifierCode();
  window.sessionStorage.setItem(CODE_VERIFIER_STORAGE_KEY, codeVerifier);
  return codeVerifier;
}

function getCodeVerifier() {
  return window.sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY);
}

function clearCodeVerifier() {
  window.sessionStorage.removeItem(CODE_VERIFIER_STORAGE_KEY);
}

export default class PkceAuthenticator {
  constructor(config = {}) {
    const baseURL = trimEnd(config.base_url, '/');
    const authEndpoint = trim(config.auth_endpoint, '/');
    const authTokenEndpoint = trim(config.auth_token_endpoint, '/');
    this.auth_url = `${baseURL}/${authEndpoint}`;
    this.auth_token_url = `${baseURL}/${authTokenEndpoint}`;
    this.appID = config.app_id;
  }

  async authenticate(options, cb) {
    if (isInsecureProtocol()) {
      return cb(new Error('Cannot authenticate over insecure protocol!'));
    }

    const authURL = new URL(this.auth_url);
    authURL.searchParams.set('client_id', this.appID);
    authURL.searchParams.set('redirect_uri', document.location.origin + document.location.pathname);
    authURL.searchParams.set('response_type', 'code');
    authURL.searchParams.set('scope', options.scope);

    const state = JSON.stringify({ auth_type: 'pkce', nonce: createNonce() });

    authURL.searchParams.set('state', state);

    authURL.searchParams.set('code_challenge_method', 'S256');
    const codeVerifier = createCodeVerifier();
    const codeChallenge = await createCodeChallenge(codeVerifier);
    authURL.searchParams.set('code_challenge', codeChallenge);

    document.location.assign(authURL.href);
  }

  /**
   * Complete authentication if we were redirected back to from the provider.
   */
  async completeAuth(cb) {
    const params = new URLSearchParams(document.location.search);

    // Remove code from url
    window.history.replaceState(null, '', document.location.pathname);

    if (!params.has('code') && !params.has('error')) {
      return;
    }

    const { nonce } = JSON.parse(params.get('state'));
    const validNonce = validateNonce(nonce);
    if (!validNonce) {
      return cb(new Error('Invalid nonce'));
    }

    if (params.has('error')) {
      return cb(new Error(`${params.get('error')}: ${params.get('error_description')}`));
    }

    if (params.has('code')) {
      const code = params.get('code');
      const authURL = new URL(this.auth_token_url);
      authURL.searchParams.set('client_id', this.appID);
      authURL.searchParams.set('code', code);
      authURL.searchParams.set('grant_type', 'authorization_code');
      authURL.searchParams.set(
        'redirect_uri',
        document.location.origin + document.location.pathname,
      );
      authURL.searchParams.set('code_verifier', getCodeVerifier());
      //no need for verifier code so remove
      clearCodeVerifier();

      const response = await fetch(authURL.href, { method: 'POST' });
      const data = await response.json();
      cb(null, { token: data.access_token, ...data });
    }
  }
}
