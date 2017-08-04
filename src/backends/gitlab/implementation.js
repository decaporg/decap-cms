import semaphore from "semaphore";
import AuthenticationPage from "./AuthenticationPage";
import API from "./API";
import { fileExtension } from '../../lib/pathHelper';
import { EDITORIAL_WORKFLOW } from "../../constants/publishModes";

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitLab {
  constructor(config, proxied = false) {
    this.config = config;
    
    if (config.getIn(["publish_mode"]) === EDITORIAL_WORKFLOW) {
      throw new Error("The GitLab backend does not support the Editorial Workflow.")
    }

    if (!proxied && config.getIn(["backend", "repo"]) == null) {
      throw new Error("The GitLab backend needs a \"repo\" in the backend configuration.");
    }

    this.repo = config.getIn(["backend", "repo"], "");
    this.branch = config.getIn(["backend", "branch"], "master");
    this.api_root = config.getIn(["backend", "api_root"], "https://gitlab.com/api/v4");
    this.token = '';
  }

  authComponent() {
    return AuthenticationPage;
  }

  setUser(user) {
    this.token = user.token;
    this.api = new API({ token: this.token, branch: this.branch, repo: this.repo });
  }

  authenticate(state) {
    this.token = state.token;
    this.api = new API({ token: this.token, branch: this.branch, repo: this.repo, api_root: this.api_root });
    return this.api.user().then(user =>
      this.api.isCollaborator(user.login).then((isCollab) => {
        // Unauthorized user
        if (!isCollab) throw new Error("Your GitLab user account does not have access to this repo.");
        // Authorized user
        user.token = state.token;
        return user;
      })
    );
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  entriesByFolder(collection, extension) {
    return this.api.listFiles(collection.get("folder"))
    .then(files => files.filter(file => fileExtension(file.name) === extension))
    .then(this.fetchFiles);
  }

  entriesByFiles(collection) {
    const files = collection.get("files").map(collectionFile => ({
      path: collectionFile.get("file"),
      label: collectionFile.get("label"),
    }));
    return this.fetchFiles(files);
  }

  fetchFiles = (files) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => (
        sem.take(() => this.api.readFile(file.path, file.sha).then((data) => {
          resolve({ file, data });
          sem.leave();
        }).catch((err) => {
          sem.leave();
          reject(err);
        }))
      )));
    });
    return Promise.all(promises);
  };

  // Fetches a single entry.
  getEntry(collection, slug, path) {
    return this.api.readFile(path).then(data => ({
      file: { path },
      data,
    }));
  }

  persistEntry(entry, mediaFiles = [], options = {}) {
    return this.api.persistFiles(entry, mediaFiles, options);
  }

  deleteFile(path, commitMessage, options) {
    return this.api.deleteFile(path, commitMessage, options);
  }
}
