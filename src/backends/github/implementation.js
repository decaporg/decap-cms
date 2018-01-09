import trimStart from 'lodash/trimStart';
import semaphore from "semaphore";
import AuthenticationPage from "./AuthenticationPage";
import API from "./API";

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitHub {
  constructor(config, proxied = false) {
    this.config = config;

    if (!proxied && config.getIn(["backend", "repo"]) == null) {
      throw new Error("The GitHub backend needs a \"repo\" in the backend configuration.");
    }

    this.repo = config.getIn(["backend", "repo"], "");
    this.branch = config.getIn(["backend", "branch"], "master").trim();
    this.api_root = config.getIn(["backend", "api_root"], "https://api.github.com");
    this.token = '';
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user) {
    return this.authenticate(user);
  }

  authenticate(state) {
    this.token = state.token;
    this.api = new API({ token: this.token, branch: this.branch, repo: this.repo, api_root: this.api_root });
    return this.api.user().then(user =>
      this.api.hasWriteAccess().then((isCollab) => {
        // Unauthorized user
        if (!isCollab) throw new Error("Your GitHub user account does not have access to this repo.");
        // Authorized user
        user.token = state.token;
        return user;
      })
    );
  }

  logout() {
    this.token = null;
    return;
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  entriesByFolder(collection, extension) {
    return this.api.listFiles(collection.get("folder"))
    .then(files => files.filter(file => file.name.endsWith('.' + extension)))
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

  getMedia() {
    return this.api.listFiles(this.config.get('media_folder'))
      .then(files => files.filter(file => file.type === 'file'))
      .then(files => files.map(({ sha, name, size, download_url, path }) => {
        const url = new URL(download_url);
        if (url.pathname.match(/.svg$/)) {
          url.search += (url.search.slice(1) === '' ? '?' : '&') + 'sanitize=true';
        }
        return { id: sha, name, size, url: url.href, path };
      }));
  }

  persistEntry(entry, mediaFiles = [], options = {}) {
    return this.api.persistFiles(entry, mediaFiles, options);
  }

  /**
   * Pulls repo info from a `repos` response url property.
   *
   * Turns this:
   * '<api_root>/repo/<username>/<repo>/...'
   *
   * Into this:
   * '<username>/<repo>'
   */
  getRepoFromResponseUrl(url) {
    return url

      // -> '/repo/<username>/<repo>/...'
      .slice(this.api_root.length)

      // -> [ '', 'repo', '<username>', '<repo>', ... ]
      .split('/')

      // -> [ '<username>', '<repo>' ]
      .slice(2, 4)

      // -> '<username>/<repo>'
      .join('/');
  }

  async persistMedia(mediaFile, options = {}) {
    try {
      const response = await this.api.persistFiles(null, [mediaFile], options);
      const repo = this.repo || this.getRepoFromResponseUrl(response.url);
      const { value, size, path, fileObj } = mediaFile;
      const url = `https://raw.githubusercontent.com/${repo}/${this.branch}${path}`;
      return { id: response.sha, name: value, size: fileObj.size, url, path: trimStart(path, '/') };
    }
    catch(error) {
      console.error(error);
      throw error;
    }
  }

  deleteFile(path, commitMessage, options) {
    return this.api.deleteFile(path, commitMessage, options);
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
