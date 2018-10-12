import trimStart from 'lodash/trimStart';
import semaphore from 'semaphore';
import { stripIndent } from 'common-tags';
import { CURSOR_COMPATIBILITY_SYMBOL } from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';
import API from './API';
import { CMS_BRANCH_PREFIX } from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitLab {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      proxied: false,
      API: null,
      ...options,
    };

    if (!this.options.proxied && config.getIn(['backend', 'repo']) == null) {
      throw new Error('The GitLab backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.repo = config.getIn(['backend', 'repo'], '');
    this.branch = config.getIn(['backend', 'branch'], 'master');
    this.api_root = config.getIn(['backend', 'api_root'], 'https://gitlab.com/api/v4');
    this.token = '';
    this.squash_merges = config.getIn(['backend', 'squash_merges']);
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
      squash_merges: this.squash_merges,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
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
    return { ...user, token: state.token };
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
      .then(({ files, cursor }) => ({
        files: files.filter(file => file.name.endsWith('.' + extension)),
        cursor,
      }))
      .then(({ files, cursor }) =>
        this.fetchFiles(files).then(fetchedFiles => {
          const returnedFiles = fetchedFiles;
          returnedFiles[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
          return returnedFiles;
        }),
      );
  }

  allEntriesByFolder(collection, extension) {
    return this.api
      .listAllFiles(collection.get('folder'))
      .then(files => files.filter(file => file.name.endsWith('.' + extension)))
      .then(files =>
        this.fetchFiles(files).then(fetchedFiles => {
          const returnedFiles = fetchedFiles;
          return returnedFiles;
        }),
      );
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
              })
              .catch((error = true) => {
                console.error(`failed to load file from GitLab: ${file.path}`);
                resolve({ error });
              })
              .finally(() => sem.leave()),
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
    await this.api.persistFiles(null, [mediaFile], options);
    const { value, path, fileObj } = mediaFile;
    return { name: value, size: fileObj.size, path: trimStart(path, '/') };
  }

  deleteFile(path, commitMessage, options = {}) {
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

  // Editorial Workflow

  unpublishedEntries() {
    return this.api.listUnpublishedBranches().then(branches => {
      const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
      const promises = [];
      branches.forEach(branch => {
        promises.push(
          new Promise(resolve => {
            // Strip the `CMS_BRANCH_PREFIX` from the `branch.name` to get the `slug`.
            const slug = branch.name.split(CMS_BRANCH_PREFIX).pop();
            return sem.take(() =>
              this.unpublishedEntry(null, slug)
                .then(resolve)
                .catch((error = true) => {
                  console.error(`failed to load unpublished file from GitLab: ${slug}`);
                  resolve({ error });
                })
                .finally(() => sem.leave()),
            );
          }),
        );
      });
      return Promise.all(promises).then(loadedEntries =>
        loadedEntries.filter(loadedEntry => !loadedEntry.error),
      );
    });
  }

  unpublishedEntry(collection, slug) {
    return this.api.readUnpublishedBranchFile(slug).then(data => {
      if (!data) {
        return null;
      } else {
        return {
          slug,
          file: { path: data.metaData.objects.entry.path },
          data: data.fileData,
          metaData: data.metaData,
          isModification: data.isModification,
        };
      }
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
