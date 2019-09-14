import semaphore from 'semaphore';
import { flow, trimStart } from 'lodash';
import { stripIndent } from 'common-tags';
import {
  CURSOR_COMPATIBILITY_SYMBOL,
  filterByPropExtension,
  resolvePromiseProperties,
  then,
  unsentRequest,
} from 'netlify-cms-lib-util';
import { NetlifyAuthenticator } from 'netlify-cms-lib-auth';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

// Implementation wrapper class
export default class BitbucketBackend {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      proxied: false,
      API: null,
      updateUserCredentials: async () => null,
      ...options,
    };

    if (this.options.useWorkflow) {
      throw new Error('The BitBucket backend does not support the Editorial Workflow.');
    }

    if (!this.options.proxied && !config.getIn(['backend', 'repo'], false)) {
      throw new Error('The BitBucket backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.updateUserCredentials = this.options.updateUserCredentials;

    this.repo = config.getIn(['backend', 'repo'], '');
    this.branch = config.getIn(['backend', 'branch'], 'master');
    this.api_root = config.getIn(['backend', 'api_root'], 'https://api.bitbucket.org/2.0');
    this.base_url = config.get('base_url');
    this.site_id = config.get('site_id');
    this.token = '';
  }

  authComponent() {
    return AuthenticationPage;
  }

  setUser(user) {
    this.token = user.token;
    this.api = new API({
      requestFunction: this.apiRequestFunction,
      branch: this.branch,
      repo: this.repo,
    });
  }

  restoreUser(user) {
    return this.authenticate(user);
  }

  async authenticate(state) {
    this.token = state.token;
    this.refreshToken = state.refresh_token;
    this.api = new API({
      requestFunction: this.apiRequestFunction,
      branch: this.branch,
      repo: this.repo,
      api_root: this.api_root,
    });

    const user = await this.api.user();
    const isCollab = await this.api.hasWriteAccess(user).catch(error => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If the repo is private, make sure you're logged into a Bitbucket account with access.
      `;
      throw error;
    });

    // Unauthorized user
    if (!isCollab) {
      throw new Error('Your BitBucket user account does not have access to this repo.');
    }

    // Authorized user
    return { ...user, token: state.token, refresh_token: state.refresh_token };
  }

  getRefreshedAccessToken() {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }

    // instantiating a new Authenticator on each refresh isn't ideal,
    if (!this.auth) {
      const cfg = {
        base_url: this.base_url,
        site_id: this.site_id,
      };
      this.authenticator = new NetlifyAuthenticator(cfg);
    }

    this.refreshedTokenPromise = this.authenticator
      .refresh({ provider: 'bitbucket', refresh_token: this.refreshToken })
      .then(({ token, refresh_token }) => {
        this.token = token;
        this.refreshToken = refresh_token;
        this.refreshedTokenPromise = undefined;
        this.updateUserCredentials({ token, refresh_token });
        return token;
      });

    return this.refreshedTokenPromise;
  }

  logout() {
    this.token = null;
    return;
  }

  getToken() {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }

    return Promise.resolve(this.token);
  }

  apiRequestFunction = async req => {
    const token = this.refreshedTokenPromise ? await this.refreshedTokenPromise : this.token;
    return flow([
      unsentRequest.withHeaders({ Authorization: `Bearer ${token}` }),
      unsentRequest.performRequest,
      then(async res => {
        if (res.status === 401) {
          const json = await res.json().catch(() => null);
          if (json && json.type === 'error' && /^access token expired/i.test(json.error.message)) {
            const newToken = await this.getRefreshedAccessToken();
            const reqWithNewToken = unsentRequest.withHeaders(
              { Authorization: `Bearer ${newToken}` },
              req,
            );
            return unsentRequest.performRequest(reqWithNewToken);
          }
        }
        return res;
      }),
    ])(req);
  };

  entriesByFolder(collection, extension) {
    const listPromise = this.api.listFiles(collection.get('folder'));
    return resolvePromiseProperties({
      files: listPromise
        .then(({ entries }) => entries)
        .then(filterByPropExtension(extension, 'path'))
        .then(this.fetchFiles),
      cursor: listPromise.then(({ cursor }) => cursor),
    }).then(({ files, cursor }) => {
      files[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
      return files;
    });
  }

  allEntriesByFolder(collection, extension) {
    return this.api
      .listAllFiles(collection.get('folder'))
      .then(filterByPropExtension(extension, 'path'))
      .then(this.fetchFiles);
  }

  entriesByFiles(collection) {
    const files = collection.get('files').map(collectionFile => ({
      path: collectionFile.get('file'),
      label: collectionFile.get('label'),
    }));
    return this.fetchFiles(files);
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
                console.error(`failed to load file from BitBucket: ${file.path}`);
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

  getEntry(collection, slug, path) {
    return this.api.readFile(path).then(data => ({
      file: { path },
      data,
    }));
  }

  getMedia() {
    return this.api
      .listAllFiles(this.config.get('media_folder'))
      .then(files =>
        files.map(({ id, name, path }) => ({ id, name, path, displayURL: { id, path } })),
      );
  }

  getMediaDisplayURL(displayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || semaphore(MAX_CONCURRENT_DOWNLOADS);
    const { id, path } = displayURL;
    return new Promise((resolve, reject) =>
      this._mediaDisplayURLSem.take(() =>
        this.api
          .readFile(path, id, { parseText: false })
          .then(blob => URL.createObjectURL(blob))
          .then(resolve, reject)
          .finally(() => this._mediaDisplayURLSem.leave()),
      ),
    );
  }

  persistEntry(entry, mediaFiles, options = {}) {
    return this.api.persistFiles([entry], options);
  }

  async persistMedia(mediaFile, options = {}) {
    await this.api.persistFiles([mediaFile], options);
    const { value, path, fileObj } = mediaFile;
    return { name: value, size: fileObj.size, path: trimStart(path, '/k') };
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
