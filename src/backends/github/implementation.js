import LocalForage from 'localforage';
import AuthenticationPage from './AuthenticationPage';

const API_ROOT = 'https://api.github.com';

class API {
  constructor(token, repo, branch) {
    this.token = token;
    this.repo = repo;
    this.branch = branch;
    this.repoURL = `/repos/${this.repo}`;
  }

  user() {
    return this.request('/user');
  }

  readFile(path, sha) {
    const cache = sha ? LocalForage.getItem(`gh.${sha}`) : Promise.resolve(null);
    return cache.then((cached) => {
      if (cached) { return cached; }

      return this.request(`${this.repoURL}/contents/${path}`, {
        headers: { Accept: 'application/vnd.github.VERSION.raw' },
        data: { ref: this.branch },
        cache: false
      }).then((result) => {
        if (sha) {
          LocalForage.setItem(`gh.${sha}`, result);
        }

        return result;
      });
    });
  }

  listFiles(path) {
    return this.request(`${this.repoURL}/contents/${path}`, {
      data: { ref: this.branch }
    });
  }

  requestHeaders(headers = {}) {
    return {
      Authorization: `token ${this.token}`,
      'Content-Type': 'application/json',
      ...headers
    };
  }

  parseJsonResponse(response) {
    return response.json().then((json) => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      return json;
    });
  }

  request(path, options = {}) {
    const headers = this.requestHeaders(options.headers || {});
    return fetch(API_ROOT + path, { ...options, headers: headers }).then((response) => {
      if (response.headers.get('Content-Type').match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text();
    });
  }
}

export default class GitHub {
  constructor(config) {
    this.config = config;
    if (config.getIn(['backend', 'repo']) == null) {
      throw 'The GitHub backend needs a "repo" in the backend configuration.';
    }
    this.repo = config.getIn(['backend', 'repo']);
  }

  authComponent() {
    return AuthenticationPage;
  }

  setUser(user) {
    this.api = new API(user.token, this.repo, this.branch || 'master');
  }

  authenticate(state) {
    this.api = new API(state.token, this.repo, this.branch || 'master');
    return this.api.user().then((user) => {
      user.token = state.token;
      return user;
    });
  }

  entries(collection) {
    return this.api.listFiles(collection.get('folder')).then((files) => (
      Promise.all(files.map((file) => (
        this.api.readFile(file.path, file.sha).then((data) => {
          file.slug = file.path.split('/').pop().replace(/\.[^\.]+$/, '');
          file.raw = data;
          return file;
        })
      )))
    )).then((entries) => ({
      pagination: {},
      entries
    }));
  }

  entry(collection, slug) {
    return this.entries(collection).then((response) => (
      response.entries.filter((entry) => entry.slug === slug)[0]
    ));
  }
}
