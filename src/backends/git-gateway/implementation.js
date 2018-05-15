import GoTrue from "gotrue-js";
import jwtDecode from 'jwt-decode';
import {List} from 'immutable';
import { get, pick, intersection } from "lodash";
import GitHubBackend from "Backends/github/implementation";
import API from "./API";
import AuthenticationPage from "./AuthenticationPage";

const localHosts = {
  localhost: true,
  '127.0.0.1': true,
  '0.0.0.0': true
}
const defaults = {
  identity: '/.netlify/identity',
  gateway: '/.netlify/git/github'
}

function getEndpoint(endpoint, netlifySiteURL) {
  if (localHosts[document.location.host.split(":").shift()] && netlifySiteURL && endpoint.match(/^\/\.netlify\//)) {
    const parts = [];
    if (netlifySiteURL) {
      parts.push(netlifySiteURL);
      if (!netlifySiteURL.match(/\/$/)) { parts.push("/"); }
    }
    parts.push(endpoint.replace(/^\//, ''));
    return parts.join("");
  }
  return endpoint;
}

export default class GitGateway extends GitHubBackend {
  constructor(config) {
    super(config, true);

    this.accept_roles = (config.getIn(["backend", "accept_roles"]) || List()).toArray();

    const netlifySiteURL = localStorage.getItem("netlifySiteURL");
    const APIUrl = getEndpoint(config.getIn(["backend", "identity_url"], defaults.identity), netlifySiteURL);
    this.github_proxy_url = getEndpoint(config.getIn(["backend", "gateway_url"], defaults.gateway), netlifySiteURL);
    this.authClient = window.netlifyIdentity ? window.netlifyIdentity.gotrue : new GoTrue({APIUrl});

    AuthenticationPage.authClient = this.authClient;
  }

  restoreUser() {
    const user = this.authClient && this.authClient.currentUser();
    if (!user) return Promise.reject();
    return this.authenticate(user);
  }

  authenticate(user) {
    this.tokenPromise = user.jwt.bind(user);
    return this.tokenPromise()
    .then((token) => {
      let validRole = true;
      if (this.accept_roles && this.accept_roles.length > 0) {
        const userRoles = get(jwtDecode(token), 'app_metadata.roles', []);
        validRole = intersection(userRoles, this.accept_roles).length > 0;
      }
      if (validRole) {
        const userData = {
          name: user.user_metadata.name || user.email.split('@').shift(),
          email: user.email,
          avatar_url: user.user_metadata.avatar_url,
          metadata: user.user_metadata,
        };
        this.api = new API({
          api_root: this.github_proxy_url,
          branch: this.branch,
          tokenPromise: this.tokenPromise,
          commitAuthor: pick(userData, ["name", "email"]),
          squash_merges: this.squash_merges,
        });
        return userData;
      } else {
        throw new Error("You don't have sufficient permissions to access Netlify CMS");
      }
    })
    .then(userData =>
      this.api.hasWriteAccess().then(canWrite => {
        if (canWrite) {
          return userData;
        } else {
          throw new Error("You don't have sufficient permissions to access Netlify CMS");
        }
      })
    );
  }

  logout() {
    if (window.netlifyIdentity) {
      return window.netlifyIdentity.logout();
    }
    const user = this.authClient.currentUser();
    return user && user.logout();
  }

  getToken() {
    return this.tokenPromise();
  }

  authComponent() {
    return AuthenticationPage;
  }

}
