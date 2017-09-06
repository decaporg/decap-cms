import GoTrue from "gotrue-js";
import jwtDecode from 'jwt-decode';
import {List} from 'immutable';
import { get, pick, intersection } from "lodash";
import GitHubBackend from "../github/implementation";
import API from "./API";
import AuthenticationPage from "./AuthenticationPage";

const localHosts = {
  localhost: true,
  '127.0.0.1': true,
  '0.0.0.0': true
}

function getEndpoint(endpoint, netlifySiteURL) {
  if (localHosts[document.location.host] && netlifySiteURL && endpoint.match(/^\/\.netlify\//)) {
    const parts = [netlifySiteURL];
    if (!netlifySiteURL.match(/\/$/)) { parts.push("/"); }
    parts.push(endpoint);
    return parts.join("");
  }
  return endpoint;
}

export default class NetlifyAuth extends GitHubBackend {
  constructor(config) {
    super(config, true);
    if (config.getIn(["backend", "auth_url"]) == null) { throw new Error("The NetlifyAuth backend needs an \"auth_url\" in the backend configuration."); }

    if (config.getIn(["backend", "github_proxy_url"]) == null) {
      throw new Error("The NetlifyAuth backend needs an \"github_proxy_url\" in the backend configuration.");
    }

    this.accept_roles = (config.getIn(["backend", "accept_roles"]) || List()).toArray();

    const netlifySiteURL = localStorage.getItem("netlifySiteURL");
    const APIUrl = getEndpoint(config.getIn(["backend", "auth_url"]), netlifySiteURL);
    this.github_proxy_url = getEndpoint(config.getIn(["backend", "github_proxy_url"]), netlifySiteURL);
    this.authClient = new GoTrue({APIUrl});

    AuthenticationPage.authClient = this.authClient;
  }

  setUser() {
    const user = this.authClient.currentUser();
    if (!user) return Promise.reject();
    return this.authenticate(user);
  }

  authenticate(user) {
    this.tokenPromise = user.jwt.bind(user);
    return this.tokenPromise()
    .then((token) => {
      let validRole = true;
      if (this.accept_roles && this.accept_roles.length > 0) {
        validRole = intersection(userRoles, this.accept_roles).length > 0;
      }
      const userRoles = get(jwtDecode(token), 'app_metadata.roles', []);
      if (validRole) {
        const userData = {
          name: user.user_metadata.name,
          email: user.email,
          metadata: user.user_metadata,
        };
        this.api = new API({
          api_root: this.github_proxy_url,
          tokenPromise: this.tokenPromise,
          commitAuthor: pick(userData, ["name", "email"]),
        });
        return userData;
      } else {
        throw new Error("You don't have sufficient permissions to access Netlify CMS");
      }
    });
  }

  getToken() {
    return this.tokenPromise();
  }

  authComponent() {
    return AuthenticationPage;
  }

}
