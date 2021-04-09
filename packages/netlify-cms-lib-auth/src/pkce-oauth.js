// copied from existing implicit oath implimintation
// and modified to peform PKCE
//lots of this is the same as implicit oauth and sholuld be refactored
//import { Map } from 'immutable';
import trim from 'lodash/trim';
import trimEnd from 'lodash/trimEnd';
import uuid from 'uuid/v4';

function createNonce() {
  const nonce = uuid();
  window.sessionStorage.setItem('netlify-cms-auth', JSON.stringify({ nonce }));
  return nonce;
}

function validateNonce(check) {
  const auth = window.sessionStorage.getItem('netlify-cms-auth');
  const valid = auth && JSON.parse(auth).nonce;
  window.localStorage.removeItem('netlify-cms-auth');
  return check === valid;
}

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
function generateCode() {
  const randomValuesArr = new Uint8Array(128);
  return Array.from(window.crypto.getRandomValues(randomValuesArr))
    .map(val => {
      // characters that can be used for codeVerifer
      // excludes _~ as if included would cause an uneven distobution as char.length would no longer be a factor of 256
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.';
      return chars[val % chars.length];
    })
    .join('');
}

function createOrRestoreCodeVerifier() {
  if (window.sessionStorage.getItem('netlify-cms-pkce-token') === null) {
    window.sessionStorage.setItem('netlify-cms-pkce-token', generateCode());
  }
  return window.sessionStorage.getItem('netlify-cms-pkce-token');
}

export default class PkceAuthenticator {
  constructor(config = {}) {
    const baseURL = trimEnd(config.base_url, '/');
    const authEndpoint = trim(config.auth_endpoint, '/');
    const authTokenEndpoint = trim(config.auth_token_endpoint, '/');
    this.auth_url = `${baseURL}/${authEndpoint}`;
    this.auth_token_url = `${baseURL}/${authTokenEndpoint}`;
    this.appID = config.app_id;
    //this.clearHash = config.clearHash;
  }

  authenticate(options, cb) {
    createOrRestoreCodeVerifier();
    console.log('ask for auth');
    if (
      document.location.protocol !== 'https:' &&
      // TODO: Is insecure localhost a bad idea as well? I don't think it is, since you are not actually
      //       sending the token over the internet in this case, assuming the auth URL is secure.
      document.location.hostname !== 'localhost' &&
      document.location.hostname !== '127.0.0.1'
    ) {
      return cb(new Error('Cannot authenticate over insecure protocol!'));
    }
    console.log(createOrRestoreCodeVerifier());
    const authURL = new URL(this.auth_url);
    authURL.searchParams.set('client_id', this.appID);
    authURL.searchParams.set('redirect_uri', document.location.origin + document.location.pathname);
    authURL.searchParams.set('response_type', 'code');
    authURL.searchParams.set('scope', options.scope);

    if (options.prompt != null && options.prompt != undefined) {
      authURL.searchParams.set('prompt', options.prompt);
    }

    if (options.resource != null && options.resource != undefined) {
      authURL.searchParams.set('resource', options.resource);
    }

    const state = JSON.stringify({ auth_type: 'pkce', nonce: createNonce() });

    authURL.searchParams.set('state', state);

    authURL.searchParams.set('code_challenge_method', 'S256');
    sha256(createOrRestoreCodeVerifier()).then(hash => {
      console.log('hash ' + hash);
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
    console.log('ask for token');
    //const hashParams = new URLSearchParams(document.location.hash.replace(/^#?\/?/, ''));
    // if (!hashParams.has('access_token') && !hashParams.has('error')) {
    //   return;
    // }
    // // Remove tokens from hash so that token does not remain in browser history.
    // this.clearHash();

    // const params = Map(hashParams.entries());
    const params = new URLSearchParams(document.location.search);

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
      //const { access_token: token, ...data } = params.toJS();
      const code = params.get('code');
      console.log('gitlabcode ' + code);
      const authURL = new URL(this.auth_token_url);
      authURL.searchParams.set('client_id', this.appID);
      authURL.searchParams.set('code', code);
      authURL.searchParams.set('grant_type', 'authorization_code');
      authURL.searchParams.set(
        'redirect_uri',
        document.location.origin + document.location.pathname,
      );
      authURL.searchParams.set('code_verifier', createOrRestoreCodeVerifier());
      console.log(createOrRestoreCodeVerifier());
      fetch(authURL.href, { method: 'POST' }).then(async res => {
        window.sessionStorage.removeItem('netlify-cms-pkce-token');
        const data = await res.json();
        cb(null, { token: data.access_token, ...data });
      });
    }
  }
}
