const NETLIFY_API = 'https://api.netlify.com';

class NetlifyError {
  constructor(err) {
    this.err = err;
  }
  toString() {
    return this.err && this.err.message;
  }
}

const PROVIDERS = {
  github: {
    width: 960,
    height: 600
  },
  gitlab: {
    width: 960,
    height: 600
  },
  bitbucket: {
    width: 960,
    height: 600
  },
  email: {
    width: 500,
    height: 400
  }
};

class Authenticator {
  constructor(config = {}) {
    this.site_id = config.site_id || null;
    this.base_url = config.base_url || NETLIFY_API;
  }

  handshakeCallback(options, cb) {
    const fn = (e) => {
      if (e.data === ('authorizing:' + options.provider) && e.origin === this.base_url) {
        window.removeEventListener('message', fn, false);
        window.addEventListener('message', this.authorizeCallback(options, cb), false);
        return this.authWindow.postMessage(e.data, e.origin);
      }
    };
    return fn;
  }

  authorizeCallback(options, cb) {
    const fn = (e) => {
      var data, err;
      if (e.origin !== this.base_url) { return; }
      if (e.data.indexOf('authorization:' + options.provider + ':success:') === 0) {
        data = JSON.parse(e.data.match(new RegExp('^authorization:' + options.provider + ':success:(.+)$'))[1]);
        window.removeEventListener('message', fn, false);
        this.authWindow.close();
        cb(null, data);
      }
      if (e.data.indexOf('authorization:' + options.provider + ':error:') === 0) {
        console.log('Got authorization error');
        err = JSON.parse(e.data.match(new RegExp('^authorization:' + options.provider + ':error:(.+)$'))[1]);
        window.removeEventListener('message', fn, false);
        this.authWindow.close();
        cb(new NetlifyError(err));
      }
    };
    return fn;
  }

  getSiteID() {
    if (this.site_id) {
      return this.site_id;
    }
    const host = document.location.host.split(':')[0];
    return host === 'localhost' ? null : host;
  }

  //NOTE the auth server needs to have CORS enabled for this direct request to work
  //todo: is this the best place for this refresh auth token code to live?
  //todo: will netlify auth server use cors and direct request?
  refreshAuthToken(options) {
    // const base_url = this.base_url; //todo: how to get proper config base_url from app/props config.base_url
    const base_url = "https://netlify-bitbucket-oauth.now.sh";
    //todo: is this the same endpoint that netlify server will use (/refresh) or will it use a grant_type instead?
    const url = base_url + '/refresh?access_token=' + options.access_token + '&refresh_token=' + options.refresh_token;

    return fetch(url).then((response) => {
      return response.json().then((json) => {
        if (!response.ok) {
          return Promise.reject(json);
        }
        return json;
      });
    });
  }

  authenticate(options, cb) {
    var left, top, url,
      siteID = this.getSiteID(),
      provider = options.provider;
    if (!provider) {
      return cb(new NetlifyError({
        message: 'You must specify a provider when calling netlify.authenticate'
      }));
    }
    if (!siteID) {
      return cb(new NetlifyError({
        message: 'You must set a site_id with netlify.configure({site_id: \'your-site-id\'}) to make authentication work from localhost'
      }));
    }

    const conf = PROVIDERS[provider] || PROVIDERS.github;
    left = (screen.width / 2) - (conf.width / 2);
    top = (screen.height / 2) - (conf.height / 2);
    window.addEventListener('message', this.handshakeCallback(options, cb), false);
    url = this.base_url + '/auth?provider=' + options.provider + '&site_id=' + siteID;
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
      'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, ' +
      ('width=' + conf.width + ', height=' + conf.height + ', top=' + top + ', left=' + left + ');')
    );
    this.authWindow.focus();
  }
}

export default Authenticator;
