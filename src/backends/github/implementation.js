import semaphore from "semaphore";
import AuthenticationPage from "./AuthenticationPage";
import API from "./API";
import { fileExtension } from '../../lib/pathHelper'

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitHub {
  constructor(config, proxied = false) {
    this.config = config;

    if (!proxied && config.getIn(["backend", "repo"]) == null) {
      throw new Error("The GitHub backend needs a \"repo\" in the backend configuration.");
    }

    this.repo = config.getIn(["backend", "repo"], "");
    this.branch = config.getIn(["backend", "branch"], "master");
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
    this.api = new API({ token: this.token, branch: this.branch, repo: this.repo });
    return this.api.user().then((user) => {
      user.token = state.token;
      return user;
    });
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

  unpublishedEntries() {
    return this.api.listUnpublishedBranches().then((branches) => {
      const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
      const promises = [];
      branches.map((branch) => {
        promises.push(new Promise((resolve, reject) => {
          const slug = branch.ref.split("refs/heads/cms/").pop();
          return sem.take(() => this.api.readUnpublishedBranchFile(slug).then((data) => {
            if (data === null || data === undefined) {
              resolve(null);
              sem.leave();
            } else {
              const path = data.metaData.objects.entry.path;
              resolve({
                slug,
                file: { path },
                data: data.fileData,
                metaData: data.metaData,
                isModification: data.isModification,
              });
              sem.leave();
            }
          }).catch((err) => {
            sem.leave();
            resolve(null);
          }));
        }));
      });
      return Promise.all(promises);
    })
    .catch((error) => {
      if (error.message === "Not Found") {
        return Promise.resolve([]);
      }
      return error;
    });
  }

  unpublishedEntry(collection, slug) {
    return this.api.readUnpublishedBranchFile(slug)
    .then((data) => {
      if (!data) return null;
      return {
        slug,
        file: { path: data.metaData.objects.entry.path },
        data: data.fileData,
        metaData: data.metaData,
        isModification: data.isModification,
      };
    });
  }

  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.api.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }

  deleteUnpublishedEntry(collection, slug) {
    return this.api.deleteUnpublishedEntry(collection, slug);
  }
  publishUnpublishedEntry(collection, slug) {
    return this.api.publishUnpublishedEntry(collection, slug);
  }
}
