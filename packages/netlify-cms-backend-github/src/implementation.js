import React from 'react';
import trimStart from 'lodash/trimStart';
import semaphore from 'semaphore';
import { stripIndent } from 'common-tags';
import { asyncLock } from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';
import API from './API';
import GraphQLAPI from './GraphQLAPI';

const MAX_CONCURRENT_DOWNLOADS = 10;

/**
 * Keywords for inferring a status that will provide a deploy preview URL.
 */
const PREVIEW_CONTEXT_KEYWORDS = ['deploy'];

/**
 * Check a given status context string to determine if it provides a link to a
 * deploy preview. Checks for an exact match against `previewContext` if given,
 * otherwise checks for inclusion of a value from `PREVIEW_CONTEXT_KEYWORDS`.
 */
function isPreviewContext(context, previewContext) {
  if (previewContext) {
    return context === previewContext;
  }
  return PREVIEW_CONTEXT_KEYWORDS.some(keyword => context.includes(keyword));
}

/**
 * Retrieve a deploy preview URL from an array of statuses. By default, a
 * matching status is inferred via `isPreviewContext`.
 */
function getPreviewStatus(statuses, config) {
  const previewContext = config.getIn(['backend', 'preview_context']);
  return statuses.find(({ context }) => {
    return isPreviewContext(context, previewContext);
  });
}

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

    this.openAuthoringEnabled = config.getIn(['backend', 'open_authoring'], false);
    if (this.openAuthoringEnabled) {
      if (!this.options.useWorkflow) {
        throw new Error(
          'backend.open_authoring is true but publish_mode is not set to editorial_workflow.',
        );
      }
      this.originRepo = config.getIn(['backend', 'repo'], '');
    } else {
      this.repo = this.originRepo = config.getIn(['backend', 'repo'], '');
    }
    this.branch = config.getIn(['backend', 'branch'], 'master').trim();
    this.api_root = config.getIn(['backend', 'api_root'], 'https://api.github.com');
    this.token = '';
    this.squash_merges = config.getIn(['backend', 'squash_merges']);
    this.use_graphql = config.getIn(['backend', 'use_graphql']);
    this.lock = asyncLock();
  }

  async runWithLock(func, message) {
    try {
      const acquired = await this.lock.acquire();
      if (!acquired) {
        console.warn(message);
      }

      const result = await func();
      return result;
    } finally {
      this.lock.release();
    }
  }

  authComponent() {
    const wrappedAuthenticationPage = props => <AuthenticationPage {...props} backend={this} />;
    wrappedAuthenticationPage.displayName = 'AuthenticationPage';
    return wrappedAuthenticationPage;
  }

  restoreUser(user) {
    return this.openAuthoringEnabled
      ? this.authenticateWithFork({ userData: user, getPermissionToFork: () => true }).then(() =>
          this.authenticate(user),
        )
      : this.authenticate(user);
  }

  async pollUntilForkExists({ repo, token }) {
    const pollDelay = 250; // milliseconds
    var repoExists = false;
    while (!repoExists) {
      repoExists = await fetch(`${this.api_root}/repos/${repo}`, {
        headers: { Authorization: `token ${token}` },
      })
        .then(() => true)
        .catch(err => (err && err.status === 404 ? false : Promise.reject(err)));
      // wait between polls
      if (!repoExists) {
        await new Promise(resolve => setTimeout(resolve, pollDelay));
      }
    }
    return Promise.resolve();
  }

  async currentUser({ token }) {
    if (!this._currentUserPromise) {
      this._currentUserPromise = fetch(`${this.api_root}/user`, {
        headers: {
          Authorization: `token ${token}`,
        },
      }).then(res => res.json());
    }
    return this._currentUserPromise;
  }

  async userIsOriginMaintainer({ username: usernameArg, token }) {
    const username = usernameArg || (await this.currentUser({ token })).login;
    this._userIsOriginMaintainerPromises = this._userIsOriginMaintainerPromises || {};
    if (!this._userIsOriginMaintainerPromises[username]) {
      this._userIsOriginMaintainerPromises[username] = fetch(
        `${this.api_root}/repos/${this.originRepo}/collaborators/${username}/permission`,
        {
          headers: {
            Authorization: `token ${token}`,
          },
        },
      )
        .then(res => res.json())
        .then(({ permission }) => permission === 'admin' || permission === 'write');
    }
    return this._userIsOriginMaintainerPromises[username];
  }

  async authenticateWithFork({ userData, getPermissionToFork }) {
    if (!this.openAuthoringEnabled) {
      throw new Error('Cannot authenticate with fork; Open Authoring is turned off.');
    }
    const { token } = userData;

    // Origin maintainers should be able to use the CMS normally
    if (await this.userIsOriginMaintainer({ token })) {
      this.repo = this.originRepo;
      this.useOpenAuthoring = false;
      return Promise.resolve();
    }

    await getPermissionToFork();

    const fork = await fetch(`${this.api_root}/repos/${this.originRepo}/forks`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
      },
    }).then(res => res.json());
    this.useOpenAuthoring = true;
    this.repo = fork.full_name;
    return this.pollUntilForkExists({ repo: fork.full_name, token });
  }

  async authenticate(state) {
    this.token = state.token;
    const apiCtor = this.use_graphql ? GraphQLAPI : API;
    this.api = new apiCtor({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      originRepo: this.originRepo,
      api_root: this.api_root,
      squash_merges: this.squash_merges,
      useOpenAuthoring: this.useOpenAuthoring,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
    });
    const user = await this.api.user();
    const isCollab = await this.api.hasWriteAccess().catch(error => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If the repo is private, make sure you're logged into a GitHub account with access.

        If your repo is under an organization, ensure the organization has granted access to Netlify
        CMS.
      `;
      throw error;
    });

    // Unauthorized user
    if (!isCollab) {
      throw new Error('Your GitHub user account does not have access to this repo.');
    }

    // Authorized user
    return { ...user, token: state.token, useOpenAuthoring: this.useOpenAuthoring };
  }

  logout() {
    this.token = null;
    if (typeof this.api.reset === 'function') {
      return this.api.reset();
    }
    return;
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  async entriesByFolder(collection, extension) {
    const repoURL = this.useOpenAuthoring ? this.api.originRepoURL : this.api.repoURL;
    const files = await this.api.listFiles(collection.get('folder'), { repoURL });
    const filteredFiles = files.filter(file => file.name.endsWith('.' + extension));
    return this.fetchFiles(filteredFiles, { repoURL });
  }

  entriesByFiles(collection) {
    const repoURL = this.useOpenAuthoring ? this.api.originRepoURL : this.api.repoURL;
    const files = collection.get('files').map(collectionFile => ({
      path: collectionFile.get('file'),
      label: collectionFile.get('label'),
    }));
    return this.fetchFiles(files, { repoURL });
  }

  fetchFiles = (files, { repoURL = this.api.repoURL } = {}) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach(file => {
      promises.push(
        new Promise(resolve =>
          sem.take(() =>
            this.api
              .readFile(file.path, file.sha, { repoURL })
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
    const repoURL = this.api.originRepoURL;
    return this.api.readFile(path, null, { repoURL }).then(data => ({
      file: { path },
      data,
    }));
  }

  getMedia() {
    return this.api.listFiles(this.config.get('media_folder')).then(files =>
      files.map(({ sha, name, size, download_url, path }) => {
        if (download_url) {
          const url = new URL(download_url);
          if (url.pathname.match(/.svg$/)) {
            url.search += (url.search.slice(1) === '' ? '?' : '&') + 'sanitize=true';
          }
          // if 'displayURL' is a string it will be loaded as is
          return { id: sha, name, size, displayURL: url.href, path };
        } else {
          // if 'displayURL' is not a string it will be loaded using getMediaDisplayURL
          return { id: sha, name, size, displayURL: { sha }, path };
        }
      }),
    );
  }

  async getMediaDisplayURL(displayURL) {
    const { sha } = displayURL;
    const mediaURL = await this.api.getMediaDisplayURL(sha);
    return mediaURL;
  }

  persistEntry(entry, mediaFiles = [], options = {}) {
    // persistEntry is a transactional operation
    return this.runWithLock(
      () => this.api.persistFiles(entry, mediaFiles, options),
      'Failed to acquire persist entry lock',
    );
  }

  async persistMedia(mediaFile, options = {}) {
    try {
      await this.api.persistFiles(null, [mediaFile], options);

      const { sha, value, path, fileObj } = mediaFile;
      const displayURL = URL.createObjectURL(fileObj);
      return {
        id: sha,
        name: value,
        size: fileObj.size,
        displayURL,
        path: trimStart(path, '/'),
      };
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
        branches.map(({ ref }) => {
          promises.push(
            new Promise(resolve => {
              const contentKey = ref.split('refs/heads/cms/').pop();
              const slug = contentKey.split('/').pop();
              return sem.take(() =>
                this.api
                  .readUnpublishedBranchFile(contentKey)
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
        return Promise.reject(error);
      });
  }

  unpublishedEntry(collection, slug) {
    const contentKey = this.api.generateContentKey(collection.get('name'), slug);
    return this.api.readUnpublishedBranchFile(contentKey).then(data => {
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

  /**
   * Uses GitHub's Statuses API to retrieve statuses, infers which is for a
   * deploy preview via `getPreviewStatus`. Returns the url provided by the
   * status, as well as the status state, which should be one of 'success',
   * 'pending', and 'failure'.
   */
  async getDeployPreview(collection, slug) {
    const contentKey = this.api.generateContentKey(collection.get('name'), slug);
    const data = await this.api.retrieveMetadata(contentKey);

    if (!data || !data.pr) {
      return null;
    }

    const headSHA = typeof data.pr.head === 'string' ? data.pr.head : data.pr.head.sha;
    const statuses = await this.api.getStatuses(headSHA);
    const deployStatus = getPreviewStatus(statuses, this.config);

    if (deployStatus) {
      const { target_url, state } = deployStatus;
      return { url: target_url, status: state };
    }
  }

  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    // updateUnpublishedEntryStatus is a transactional operation
    return this.runWithLock(
      () => this.api.updateUnpublishedEntryStatus(collection, slug, newStatus),
      'Failed to acquire update entry status lock',
    );
  }

  deleteUnpublishedEntry(collection, slug) {
    return this.api.deleteUnpublishedEntry(collection, slug);
  }

  publishUnpublishedEntry(collection, slug) {
    // publishUnpublishedEntry is a transactional operation
    return this.runWithLock(
      () => this.api.publishUnpublishedEntry(collection, slug),
      'Failed to acquire publish entry lock',
    );
  }
}
