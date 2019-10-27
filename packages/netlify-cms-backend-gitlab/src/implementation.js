import trimStart from 'lodash/trimStart';
import semaphore from 'semaphore';
import { stripIndent } from 'common-tags';
import { CURSOR_COMPATIBILITY_SYMBOL } from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitLab {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      proxied: false,
      API: null,
      ...options,
    };

    if (this.options.useWorkflow) {
      throw new Error('The GitLab backend does not support the Editorial Workflow.');
    }

    if (!this.options.proxied && config.getIn(['backend', 'repo']) == null) {
      throw new Error('The GitLab backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.repo = config.getIn(['backend', 'repo'], '');
    this.branch = config.getIn(['backend', 'branch'], 'master');
    this.api_root = config.getIn(['backend', 'api_root'], 'https://gitlab.com/api/v4');
    this.token = '';
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user) {
    return this.authenticate(user);
  }

  async authenticate(state) {
    this.token = state.token;
    this.api = new API({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      api_root: this.api_root,
    });
    const user = await this.api.user();
    const isCollab = await this.api.hasWriteAccess(user).catch(error => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If the repo is private, make sure you're logged into a GitLab account with access.
      `;
      throw error;
    });

    // Unauthorized user
    if (!isCollab) {
      throw new Error('Your GitLab user account does not have access to this repo.');
    }

    // Authorized user
    return { ...user, login: user.username, token: state.token };
  }

  logout() {
    this.token = null;
    return;
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  entriesByFolder(collection, extension) {
    return this.api.listFiles(collection.get('folder')).then(({ files, cursor }) =>
      this.fetchFiles(files.filter(file => file.name.endsWith('.' + extension))).then(
        fetchedFiles => {
          const returnedFiles = fetchedFiles;
          returnedFiles[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
          return returnedFiles;
        },
      ),
    );
  }

  allEntriesByFolder(collection, extension) {
    return this.api
      .listAllFiles(collection.get('folder'))
      .then(files => this.fetchFiles(files.filter(file => file.name.endsWith('.' + extension))));
  }

  entriesByFiles(collection) {
    const files = collection.get('files').map(collectionFile => ({
      path: collectionFile.get('file'),
      label: collectionFile.get('label'),
    }));
    return this.fetchFiles(files).then(fetchedFiles => {
      const returnedFiles = fetchedFiles;
      return returnedFiles;
    });
  }

  fetchFiles = files => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach(file => {
      promises.push(
        new Promise(resolve =>
          sem.take(() =>
            this.api
              .readFile(file.path, file.id)
              .then(data => {
                resolve({ file, data });
                sem.leave();
              })
              .catch((error = true) => {
                sem.leave();
                console.error(`failed to load file from GitLab: ${file.path}`);
                resolve({ error });
              }),
          ),
        ),
      );
    });
    return Promise.all(promises).then(loadedEntries =>
      loadedEntries.filter(loadedEntry => !loadedEntry.error),
    );
  };

  // Fetches a single entry.
  getEntry(collection, slug, path) {
    return this.api.readFile(path).then(data => ({
      file: { path },
      data,
    }));
  }

  getMedia() {
    return this.api.listAllFiles(this.config.get('media_folder')).then(files =>
      files.map(({ id, name, path }) => {
        return { id, name, path, displayURL: { id, name, path } };
      }),
    );
  }

  getMediaDisplayURL(displayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || semaphore(MAX_CONCURRENT_DOWNLOADS);
    const { id, name, path } = displayURL;
    return new Promise((resolve, reject) =>
      this._mediaDisplayURLSem.take(() =>
        this.api
          .readFile(path, id, { parseText: false })
          .then(blob => {
            // svgs are returned with mimetype "text/plain" by gitlab
            if (blob.type === 'text/plain' && name.match(/\.svg$/i)) {
              return new window.Blob([blob], { type: 'image/svg+xml' });
            }
            return blob;
          })
          .then(blob => URL.createObjectURL(blob))
          .then(resolve, reject)
          .finally(() => this._mediaDisplayURLSem.leave()),
      ),
    );
  }

  async persistEntry(entry, mediaFiles, options = {}) {
    return this.api.persistFiles([entry], options);
  }

  async persistMedia(mediaFile, options = {}) {
    await this.api.persistFiles([mediaFile], options);
    const { value, path, fileObj } = mediaFile;
    return { name: value, size: fileObj.size, path: trimStart(path, '/') };
  }

  deleteFile(path, commitMessage, options) {
    return this.api.deleteFile(path, commitMessage, options);
  }

  traverseCursor(cursor, action) {
    return this.api.traverseCursor(cursor, action).then(async ({ entries, cursor: newCursor }) => ({
      entries: await Promise.all(
        entries.map(file => this.api.readFile(file.path, file.id).then(data => ({ file, data }))),
      ),
      cursor: newCursor,
    }));
  }
}
