import trimStart from 'lodash/trimStart';
import semaphore from "semaphore";
import AuthenticationPage from "./AuthenticationPage";
import API from "./API";
import { CURSOR_COMPATIBILITY_SYMBOL } from 'ValueObjects/Cursor';
import { EDITORIAL_WORKFLOW } from "Constants/publishModes";

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitLab {
  constructor(config, options={}) {
    this.config = config;
    this.options = {
      proxied: false,
      API: null,
      ...options,
    };

    if (config.getIn(["publish_mode"]) === EDITORIAL_WORKFLOW) {
      throw new Error("The GitLab backend does not support the Editorial Workflow.")
    }

    if (!this.options.proxied && config.getIn(["backend", "repo"]) == null) {
      throw new Error("The GitLab backend needs a \"repo\" in the backend configuration.");
    }

    this.api = this.options.API || null;

    this.repo = config.getIn(["backend", "repo"], "");
    this.branch = config.getIn(["backend", "branch"], "master");
    this.api_root = config.getIn(["backend", "api_root"], "https://gitlab.com/api/v4");
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
      this.api.hasWriteAccess(user).then((isCollab) => {
        // Unauthorized user
        if (!isCollab) throw new Error("Your GitLab user account does not have access to this repo.");
        // Authorized user
        return Object.assign({}, user, { token: state.token });
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
    .then(({ files, cursor }) =>
      this.fetchFiles(
        files.filter(file => file.name.endsWith('.' + extension))
      )
      .then(fetchedFiles => {
        const returnedFiles = fetchedFiles;
        returnedFiles[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
        return returnedFiles;
      })
    );
  }

  allEntriesByFolder(collection, extension) {
    return this.api.listAllFiles(collection.get("folder"))
    .then(files =>
      this.fetchFiles(
        files.filter(file => file.name.endsWith('.' + extension))
      )
    );
  }

  entriesByFiles(collection) {
    const files = collection.get("files").map(collectionFile => ({
      path: collectionFile.get("file"),
      label: collectionFile.get("label"),
    }));
    return this.fetchFiles(files).then(fetchedFiles => {
      const returnedFiles = fetchedFiles;
      return returnedFiles;
    });
  }

  fetchFiles = (files) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => (
        sem.take(() => this.api.readFile(file.path, file.id).then((data) => {
          resolve({ file, data });
          sem.leave();
        }).catch((error = true) => {
          sem.leave();
          console.error(`failed to load file from GitLab: ${ file.path }`);
          resolve({ error });
        }))
      )));
    });
    return Promise.all(promises)
      .then(loadedEntries => loadedEntries.filter(loadedEntry => !loadedEntry.error));
  };

  // Fetches a single entry.
  getEntry(collection, slug, path) {
    return this.api.readFile(path).then(data => ({
      file: { path },
      data,
    }));
  }

  getMedia() {
    return this.api.listAllFiles(this.config.get('media_folder'))
      .then(files => files.map(({ id, name, path }) => {
        const url = new URL(this.api.fileDownloadURL(path));
        if (url.pathname.match(/.svg$/)) {
          url.search += (url.search.slice(1) === '' ? '?' : '&') + 'sanitize=true';
        }
        return { id, name, url: url.href, path };
      }));
  }


  async persistEntry(entry, mediaFiles, options = {}) {
    return this.api.persistFiles([entry], options);
  }

  async persistMedia(mediaFile, options = {}) {
    await this.api.persistFiles([mediaFile], options);
    const { value, path, fileObj } = mediaFile;
    const url = this.api.fileDownloadURL(path);
    return { name: value, size: fileObj.size, url, path: trimStart(path, '/') };
  }

  deleteFile(path, commitMessage, options) {
    return this.api.deleteFile(path, commitMessage, options);
  }

  traverseCursor(cursor, action) {
    return this.api.traverseCursor(cursor, action)
      .then(async ({ entries, cursor: newCursor }) => ({
        entries: await Promise.all(entries.map(file => this.api.readFile(file.path, file.id).then(data => ({ file, data })))),
        cursor: newCursor,
      }));
  }
}
