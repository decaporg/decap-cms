import { trim, trimEnd } from 'lodash-es';

const NETLIFY_API = 'https://api.netlify.com';
const AUTH_ENDPOINT = 'auth';

export interface NetlifyErrorPayload {
  message?: string;
}

export class NetlifyError {
  err: NetlifyErrorPayload;

  constructor(err: NetlifyErrorPayload) {
    this.err = err;
  }

  toString(): string {
    return (this.err && this.err.message) || '';
  }
}

interface ProviderConfig {
  width: number;
  height: number;
}

type ProviderName = 'github' | 'gitlab' | 'bitbucket' | 'email';

const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  github: {
    width: 960,
    height: 600,
  },
  gitlab: {
    width: 960,
    height: 600,
  },
  bitbucket: {
    width: 960,
    height: 500,
  },
  email: {
    width: 500,
    height: 400,
  },
};

// Every member is forwarded straight from `config.backend`, where an unset key
// reads as `undefined`, so absence is spelled as an explicit `undefined`.
export interface NetlifyAuthenticatorConfig {
  site_id?: string | null | undefined;
  base_url?: string | undefined;
  auth_endpoint?: string | undefined;
}

export interface NetlifyAuthenticateOptions {
  provider: string;
  scope?: string;
  login?: boolean;
  beta_invite?: string;
  invite_code?: string;
}

export interface NetlifyRefreshOptions {
  provider: string;
  refresh_token: string;
}

export interface NetlifyAuthResult {
  token?: string;
  [key: string]: unknown;
}

export type NetlifyAuthCallback = (error: NetlifyError | null, data?: NetlifyAuthResult) => void;
export type NetlifyRefreshCallback = (error: NetlifyError | null, data?: NetlifyAuthResult) => void;

class Authenticator {
  site_id: string | null;
  base_url: string;
  auth_endpoint: string;
  authWindow: Window | null = null;

  constructor(config: NetlifyAuthenticatorConfig = {}) {
    this.site_id = config.site_id || null;
    this.base_url = trimEnd(config.base_url, '/') || NETLIFY_API;
    this.auth_endpoint = trim(config.auth_endpoint, '/') || AUTH_ENDPOINT;
  }

  handshakeCallback(
    options: NetlifyAuthenticateOptions,
    cb: NetlifyAuthCallback,
  ): (e: MessageEvent) => void {
    const fn = (e: MessageEvent): void => {
      if (e.data === 'authorizing:' + options.provider && e.origin === this.base_url) {
        window.removeEventListener('message', fn, false);
        window.addEventListener('message', this.authorizeCallback(options, cb), false);
        return this.authWindow?.postMessage(e.data, e.origin);
      }
    };
    return fn;
  }

  authorizeCallback(
    options: NetlifyAuthenticateOptions,
    cb: NetlifyAuthCallback,
  ): (e: MessageEvent) => void {
    const fn = (e: MessageEvent): void => {
      if (e.origin !== this.base_url) {
        return;
      }

      const eventData = e.data as string;
      if (eventData.indexOf('authorization:' + options.provider + ':success:') === 0) {
        const match = eventData.match(
          new RegExp('^authorization:' + options.provider + ':success:(.+)$'),
        );
        if (match) {
          const data = JSON.parse(match[1]) as NetlifyAuthResult;
          window.removeEventListener('message', fn, false);
          this.authWindow?.close();
          cb(null, data);
        }
      }
      if (eventData.indexOf('authorization:' + options.provider + ':error:') === 0) {
        const match = eventData.match(
          new RegExp('^authorization:' + options.provider + ':error:(.+)$'),
        );
        if (match) {
          const err = JSON.parse(match[1]) as NetlifyErrorPayload;
          window.removeEventListener('message', fn, false);
          this.authWindow?.close();
          cb(new NetlifyError(err));
        }
      }
    };
    return fn;
  }

  getSiteID(): string {
    if (this.site_id) {
      return this.site_id;
    }
    const host: string = document.location.host.split(':')[0];
    return host === 'localhost' ? 'demo.decapcms.org' : host;
  }

  authenticate(options: NetlifyAuthenticateOptions, cb: NetlifyAuthCallback): void {
    const { provider } = options;
    const siteID: string = this.getSiteID();

    if (!provider) {
      return cb(
        new NetlifyError({
          message: 'You must specify a provider when calling netlify.authenticate',
        }),
      );
    }
    if (!siteID) {
      return cb(
        new NetlifyError({
          message:
            "You must set a site_id with netlify.configure({site_id: 'your-site-id'}) to make authentication work from localhost",
        }),
      );
    }

    const conf: ProviderConfig = PROVIDERS[provider as ProviderName] || PROVIDERS.github;
    const left: number = screen.width / 2 - conf.width / 2;
    const top: number = screen.height / 2 - conf.height / 2;
    window.addEventListener('message', this.handshakeCallback(options, cb), false);
    let url = `${this.base_url}/${this.auth_endpoint}?provider=${options.provider}&site_id=${siteID}`;
    if (options.scope) {
      url += '&scope=' + options.scope;
    }
    if (options.login === true) {
      url += '&login=true';
    }
    if (options.beta_invite) {
      url += '&beta_invite=' + options.beta_invite;
    }
    if (options.invite_code) {
      url += '&invite_code=' + options.invite_code;
    }
    this.authWindow = window.open(
      url,
      'Netlify Authorization',
      `width=${conf.width}, height=${conf.height}, top=${top}, left=${left}`,
    );
    this.authWindow?.focus();
  }

  refresh(
    options: NetlifyRefreshOptions,
    cb?: NetlifyRefreshCallback,
  ): Promise<NetlifyAuthResult> | void {
    const { provider, refresh_token } = options;
    const siteID: string = this.getSiteID();
    const onError = cb || Promise.reject.bind(Promise);

    if (!provider || !refresh_token) {
      return onError(
        new NetlifyError({
          message: 'You must specify a provider and refresh token when calling netlify.refresh',
        }),
      );
    }
    if (!siteID) {
      return onError(
        new NetlifyError({
          message:
            "You must set a site_id with netlify.configure({site_id: 'your-site-id'}) to make token refresh work from localhost",
        }),
      );
    }
    // The refresh token goes in the POST body, never the URL, so it can't leak
    // into server logs, proxies or browser history (GHSA-jm5q-pq3r-26g9).
    const url = `${this.base_url}/${this.auth_endpoint}/refresh?provider=${provider}&site_id=${siteID}`;
    const body = new URLSearchParams({ refresh_token }).toString();
    const refreshPromise: Promise<NetlifyAuthResult> = fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then(res => res.json() as Promise<NetlifyAuthResult>);

    // Return a promise if a callback wasn't provided
    if (!cb) {
      return refreshPromise;
    }

    // Otherwise, use the provided callback.
    refreshPromise.then(data => cb(null, data)).catch(cb);
  }
}

export default Authenticator;
