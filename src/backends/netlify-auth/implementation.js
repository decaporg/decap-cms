import NetlifyAuthClient from "netlify-auth-js";
import jwtDecode from 'jwt-decode';
import { get, pick, intersection } from "lodash";
import GitHubBackend from "../github/implementation";
import API from "./API";
import AuthenticationPage from "./AuthenticationPage";

export default class NetlifyAuth extends GitHubBackend {
  constructor(config) {
    super(config, true);
    if (config.getIn(["backend", "auth_url"]) == null) { throw new Error("The NetlifyAuth backend needs an \"auth_url\" in the backend configuration."); }

    if (config.getIn(["backend", "github_proxy_url"]) == null) {
      throw new Error("The NetlifyAuth backend needs an \"github_proxy_url\" in the backend configuration.");
    }
    this.github_proxy_url = config.getIn(["backend", "github_proxy_url"]);

    if (config.getIn(["backend", "accept_roles"]) == null) {
      throw new Error("The NetlifyAuth backend needs an \"accept_roles\" in the backend configuration.");
    }
    this.accept_roles = config.getIn(["backend", "accept_roles"]).toArray();

    this.authClient = new NetlifyAuthClient({
      APIUrl: config.getIn(["backend", "auth_url"]),
    });

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
      const userRoles = get(jwtDecode(token), 'app_metadata.roles', []);
      if (intersection(userRoles, this.accept_roles).length > 0) {
        const userData = {
          name: `${ user.user_metadata.firstname } ${ user.user_metadata.lastname }`,
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
        throw new Error("User is not authorized");
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
