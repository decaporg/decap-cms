import { Map } from 'immutable';
import trim from 'lodash/trim';
import trimEnd from 'lodash/trimEnd';
import { createNonce, validateNonce, isInsecureProtocol } from './utils';

export default class ImplicitAuthenticator {
  constructor(config = {}) {
    const baseURL = trimEnd(config.base_url, '/');
    const authEndpoint = trim(config.auth_endpoint, '/');
    this.auth_url = `${baseURL}/${authEndpoint}`;
    this.appID = config.app_id;
    this.clearHash = config.clearHash;
  }

  authenticate(options, cb) {
    if (isInsecureProtocol()) {
      return cb(new Error('Cannot authenticate over insecure protocol!'));
    }

    const authURL = new URL(this.auth_url);
    authURL.searchParams.set('client_id', this.appID);
    authURL.searchParams.set('redirect_uri', document.location.origin + document.location.pathname);
    authURL.searchParams.set('response_type', 'token');
    authURL.searchParams.set('scope', options.scope);

    if (options.prompt != null && options.prompt != undefined) {
      authURL.searchParams.set('prompt', options.prompt);
    }

    if (options.resource != null && options.resource != undefined) {
      authURL.searchParams.set('resource', options.resource);
    }

    const state = JSON.stringify({ auth_type: 'implicit', nonce: createNonce() });

    authURL.searchParams.set('state', state);

    document.location.assign(authURL.href);
  }

  /**
   * Complete authentication if we were redirected back to from the provider.
   */
  completeAuth(cb) {
    const hashParams = new URLSearchParams(document.location.hash.replace(/^#?\/?/, ''));
    if (!hashParams.has('access_token') && !hashParams.has('error')) {
      return;
    }
    // Remove tokens from hash so that token does not remain in browser history.
    this.clearHash();

    const params = Map(hashParams.entries());

    const { nonce } = JSON.parse(params.get('state'));
    const validNonce = validateNonce(nonce);
    if (!validNonce) {
      return cb(new Error('Invalid nonce'));
    }

    if (params.has('error')) {
      return cb(new Error(`${params.get('error')}: ${params.get('error_description')}`));
    }

    if (params.has('access_token')) {
      const { access_token: token, ...data } = params.toJS();
      cb(null, { token, ...data });
    }
  }
}
