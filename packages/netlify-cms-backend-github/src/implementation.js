import trimStart from 'lodash/trimStart';
import semaphore from 'semaphore';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitHub {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      proxied: false,
      API: null,
      ...options,
    };

    if (!this.options.proxied && config.getIn(['backend', 'repo']) == null) {
      throw new Error('The GitHub backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.repo = config.getIn(['backend', 'repo'], '');
    this.branch = config.getIn(['backend', 'branch'], 'master').trim();
    this.api_root = config.getIn(['backend', 'api_root'], 'https://api.github.com');
    this.token = '';
    this.squash_merges = config.getIn(['backend', 'squash_merges']);
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user) {
    return this.authenticate(user);
  }

  authenticate(state) {
    this.token = state.token;
    this.api = new API({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      api_root: this.api_root,
      squash_merges: this.squash_merges,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
    });
    return this.api.user().then(user =>
      this.api.hasWriteAccess().then(isCollab => {
        // Unauthorized user
        if (!isCollab)
          throw new Error('Your GitHub user account does not have access to this repo.');
        // Authorized user
        user.token = state.token;
        return user;
      }),
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
    return this.api
      .listFiles(collection.get('folder'))
      .then(files => files.filter(file => file.name.endsWith('.' + extension)))
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
              .readFile(file.path, file.sha)
              .then(data => {
                resolve({ file, data });
                sem.leave();
              })
              .catch((err = true) => {
                sem.leave();
                console.error(`failed to load file from GitHub: ${file.path}`);
                resolve({ error: err });
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
    return this.api.listFiles(this.config.get('media_folder')).then(files =>
      files.map(({ sha, name, size, download_url, path }) => {
        const url = new URL(download_url);
        if (url.pathname.match(/.svg$/)) {
          url.search += (url.search.slice(1) === '' ? '?' : '&') + 'sanitize=true';
        }
        return { id: sha, name, size, url: url.href, path };
      }),
    );
  }

  persistEntry(entry, mediaFiles = [], options = {}) {
    return this.api.persistFiles(entry, mediaFiles, options);
  }

  async persistMedia(mediaFile, options = {}) {
    try {
      await this.api.persistFiles(null, [mediaFile], options);

      const { sha, value, path, fileObj } = mediaFile;
      const url = URL.createObjectURL(fileObj);
      return { id: sha, name: value, size: fileObj.size, url, path: trimStart(path, '/') };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  deleteFile(path, commitMessage, options) {
    return this.api.deleteFile(path, commitMessage, options);
  }

  unpublishedEntries() {
    return this.api
      .listUnpublishedBranches()
      .then(branches => {
        const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
        const promises = [];
        branches.map(branch => {
          promises.push(
            new Promise(resolve => {
              const slug = branch.ref.split('refs/heads/cms/').pop();
              return sem.take(() =>
                this.api
                  .readUnpublishedBranchFile(slug)
                  .then(data => {
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
                  })
                  .catch(() => {
                    sem.leave();
                    resolve(null);
                  }),
              );
            }),
          );
        });
        return Promise.all(promises);
      })
      .catch(error => {
        if (error.message === 'Not Found') {
          return Promise.resolve([]);
        }
        return error;
      });
  }

  unpublishedEntry(collection, slug) {
    return this.api.readUnpublishedBranchFile(slug).then(data => {
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
