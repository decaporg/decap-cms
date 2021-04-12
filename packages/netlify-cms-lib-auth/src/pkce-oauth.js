import trim from 'lodash/trim';
import trimEnd from 'lodash/trimEnd';
import { createNonce, validateNonce, isInsecureProtocol } from './utils';

async function sha256(text) {
  return Array.from(
    new Uint8Array(await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))),
  )
    .map(el => {
      return String.fromCharCode(el);
    })
    .join('');
}

//based on https://github.com/auth0/auth0-spa-js/blob/9a83f698127eae7da72691b0d4b1b847567687e3/src/utils.ts#L147
function generateVerifierCode() {
  const randomValuesArr = new Uint8Array(128);
  return Array.from(window.crypto.getRandomValues(randomValuesArr))
    .map(val => {
      // characters that can be used for codeVerifer
      // excludes _~ as if included would cause an uneven  distribution as char.length would no longer be a factor of 256
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.';
      return chars[val % chars.length];
    })
    .join('');
}

function createOrGetCodeVerifier() {
  if (window.sessionStorage.getItem('netlify-cms-pkce-verifier-code') === null) {
    window.sessionStorage.setItem('netlify-cms-pkce-verifier-code', generateVerifierCode());
  }
  return window.sessionStorage.getItem('netlify-cms-pkce-verifier-code');
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

  authenticate(options, cb) {
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
    sha256(createOrGetCodeVerifier()).then(hash => {
      //https://tools.ietf.org/html/rfc7636#appendix-A
      authURL.searchParams.set(
        'code_challenge',
        btoa(hash)
          .split('=')[0]
          .replace(/\+/g, '-')
          .replace(/\//g, '_'),
      );
      //
      document.location.assign(authURL.href);
    });
  }

  /**
   * Complete authentication if we were redirected back to from the provider.
   */
  completeAuth(cb) {
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
      authURL.searchParams.set('code_verifier', createOrGetCodeVerifier());
      fetch(authURL.href, { method: 'POST' }).then(async res => {
        const data = await res.json();
        cb(null, { token: data.access_token, ...data });
      });
      //no need for verifier code so remove
      window.sessionStorage.removeItem('netlify-cms-pkce-verifier-code');
    }
  }
}
