import GoTrue from "gotrue-js";
import jwtDecode from 'jwt-decode';
import {List} from 'immutable';
import { get, pick, intersection } from "lodash";
import GitHubBackend from "Backends/github/implementation";
import GitLabBackend from "Backends/gitlab/implementation";
import GitHubAPI from "./GitHubAPI";
import GitLabAPI from "./GitLabAPI";
import AuthenticationPage from "./AuthenticationPage";

const localHosts = {
  localhost: true,
  '127.0.0.1': true,
  '0.0.0.0': true,
};
const defaults = {
  identity: '/.netlify/identity',
  gateway: '/.netlify/git',
};

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

export default class GitGateway {
  constructor(config) {
    this.config = config;
    this.branch = config.getIn(["backend", "branch"], "master").trim();
    this.squash_merges = config.getIn(["backend", "squash_merges"]);

    const netlifySiteURL = localStorage.getItem("netlifySiteURL");
    const APIUrl = getEndpoint(config.getIn(["backend", "identity_url"], defaults.identity), netlifySiteURL);
    this.gatewayUrl = getEndpoint(config.getIn(["backend", "gateway_url"], defaults.gateway), netlifySiteURL);

    const backendTypeRegex = /\/(github|gitlab)\/?$/;
    const backendTypeMatches = this.gatewayUrl.match(backendTypeRegex);
    if (backendTypeMatches) {
      this.backendType = backendTypeMatches[1];
      this.gatewayUrl = this.gatewayUrl.replace(backendTypeRegex, "/");
    } else {
      this.backendType = null;
    }

    this.authClient = window.netlifyIdentity ? window.netlifyIdentity.gotrue : new GoTrue({ APIUrl });
    AuthenticationPage.authClient = this.authClient;

    this.backend = null;
  }
  authenticate(user) {
    this.tokenPromise = user.jwt.bind(user);
    return this.tokenPromise().then(async token => {
      if (!this.backendType) {
        const { github_enabled, gitlab_enabled, roles } = await fetch(`${ this.gatewayUrl }/settings`, {
          headers: { Authorization: `Bearer ${ token }` },
        }).then(res => res.json());
        this.acceptRoles = roles;
        if (github_enabled) {
          this.backendType = "github";
        } else if (gitlab_enabled) {
          this.backendType = "gitlab";
        }
      }

      if (this.acceptRoles && this.acceptRoles.length > 0) {
        const userRoles = get(jwtDecode(token), 'app_metadata.roles', []);
        const validRole = intersection(userRoles, this.acceptRoles).length > 0;
        if (!validRole) {
          throw new Error("You don't have sufficient permissions to access Netlify CMS");
        }
      }

      const userData = {
        name: user.user_metadata.name || user.email.split('@').shift(),
        email: user.email,
        avatar_url: user.user_metadata.avatar_url,
        metadata: user.user_metadata,
      };
      const apiConfig = {
        api_root: `${ this.gatewayUrl }/${ this.backendType }`,
        branch: this.branch,
        tokenPromise: this.tokenPromise,
        commitAuthor: pick(userData, ["name", "email"]),
        squash_merges: this.squash_merges,
      };

      if (this.backendType === "github") {
        this.api = new GitHubAPI(apiConfig);
        this.backend = new GitHubBackend(this.config, { proxied: true, API: this.api });
      } else if (this.backendType === "gitlab") {
        this.api = new GitLabAPI(apiConfig);
        this.backend = new GitLabBackend(this.config, { proxied: true, API: this.api });
      }

      if (!(await this.api.hasWriteAccess())) {
        throw new Error("You don't have sufficient permissions to access Netlify CMS");
      }
    });
  }
  restoreUser() {
    const user = this.authClient && this.authClient.currentUser();
    if (!user) return Promise.reject();
    return this.authenticate(user);
  }
  authComponent() {
    return AuthenticationPage;
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

  entriesByFolder(collection, extension) { return this.backend.entriesByFolder(collection, extension); }
  entriesByFiles(collection) { return this.backend.entriesByFiles(collection); }
  fetchFiles(files) { return this.backend.fetchFiles(files); }
  getEntry(collection, slug, path) { return this.backend.getEntry(collection, slug, path); }
  getMedia() { return this.backend.getMedia(); }
  persistEntry(entry, mediaFiles, options) { return this.backend.persistEntry(entry, mediaFiles, options); }
  persistMedia(mediaFile, options) { return this.backend.persistMedia(mediaFile, options); }
  deleteFile(path, commitMessage, options) { return this.backend.deleteFile(path, commitMessage, options); }
  unpublishedEntries() { return this.backend.unpublishedEntries(); }
  unpublishedEntry(collection, slug) { return this.backend.unpublishedEntry(collection, slug); }
  updateUnpublishedEntryStatus(collection, slug, newStatus) { return this.backend.updateUnpublishedEntryStatus(collection, slug, newStatus); }
  deleteUnpublishedEntry(collection, slug) { return this.backend.deleteUnpublishedEntry(collection, slug); }
  publishUnpublishedEntry(collection, slug) { return this.backend.publishUnpublishedEntry(collection, slug); }
  traverseCursor(cursor, action) { return this.backend.traverseCursor(cursor, action); }
}
