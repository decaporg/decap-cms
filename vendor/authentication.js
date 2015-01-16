(function(window, undefined) {
  var SITE_ID = null;
  var NETLIFY_API = "https://api.netlify.com";
  var NetlifyError = function(err) {
    this.err = err;
  };
  NetlifyError.prototype.toString = function() {
    return this.err.message;
  };
  var authWindow, base, providers;
  providers = {
    github: {
      width: 960,
      height: 600
    },
    bitbucket: {
      width: 960,
      height: 500
    },
    email: {
      width: 500,
      height: 400
    }
  };
  base = typeof NETLIFY_CFG == "object" ? NETLIFY_CFG.api_base.replace(/\/api\/v.\//, '') : NETLIFY_API;

  function handshakeCallback(options, cb) {
    var fn = function(e) {
      if (e.data === ("authorizing:" + options.provider) && e.origin === base) {
        window.removeEventListener("message", fn, false);
        window.addEventListener("message", authorizeCallback(options, cb), false);
        return authWindow.postMessage(e.data, e.origin);
      }
    }
    return fn;
  }

  function authorizeCallback(options, cb) {
    var fn = function(e) {
      var data, err;
      if (e.origin !== base) { return; }
      if (e.data.indexOf("authorization:" + options.provider + ":success:") === 0) {
        data = JSON.parse(e.data.match(new RegExp("^authorization:" + options.provider + ":success:(.+)$"))[1]);
        window.removeEventListener("message", fn, false);
        authWindow.close();
        cb(null, data);
      }
      if (e.data.indexOf("authorization:" + options.provider + ":error:") === 0) {
        err = JSON.parse(e.data.match(new RegExp("^authorization:" + options.provider + ":error:(.+)$"))[1]);
        window.removeEventListener("message", fn, false);
        authWindow.close();
        cb(new NetlifyError(err));
      }
    }
    return fn;
  }

  function getSiteID() {
    if (SITE_ID) {
      return SITE_ID;
    }
    var host = document.location.host.split(":")[0]
    return host === "localhost" ? null : host;
  }

  function authenticate(options, cb) {
    var left, top, url,
        siteID = getSiteID(),
        provider = options.provider;
    if (!provider) { return cb(new NetlifyError({message: "You must specify a provider when calling netlify.authenticate"})); }
    if (!siteID) { return cb(new NetlifyError({message: "You must set a site_id with netlify.configure({site_id: 'your-site-id'}) to make authentication work from localhost"})); }
    conf = providers[provider];
    left = (screen.width / 2) - (conf.width / 2);
    top = (screen.height / 2) - (conf.height / 2);
    window.addEventListener("message", handshakeCallback(options, cb), false);
    url = base + "/auth?provider=" + options.provider + "&site_id=" + siteID;
    if (options.scope) {
      url += "&scope=" + options.scope;
    }
    if (options.login === true) {
      url += "&login=true";
    }
    console.log("Opening window: %o", url);
    authWindow = window.open(url, "Netlify Authorization", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, " + ("width=" + conf.width + ", height=" + conf.height + ", top=" + top + ", left=" + left + ");"));
    authWindow.focus();
  }

  function configure(options) {
    if (options.site_id) {
      SITE_ID = options.site_id;
    }
  }

  window.netlify = window.netlify || {};
  window.netlify.authenticate = authenticate;
  window.netlify.configure = configure;
})(window);