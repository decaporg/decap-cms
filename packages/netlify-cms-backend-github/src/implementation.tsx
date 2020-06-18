import * as React from 'react';
import semaphore, { Semaphore } from 'semaphore';
import trimStart from 'lodash/trimStart';
import { stripIndent } from 'common-tags';
import {
  CURSOR_COMPATIBILITY_SYMBOL,
  Cursor,
  asyncLock,
  basename,
  AsyncLock,
  Implementation,
  AssetProxy,
  PersistOptions,
  DisplayURL,
  getBlobSHA,
  entriesByFolder,
  entriesByFiles,
  unpublishedEntries,
  User,
  getMediaDisplayURL,
  getMediaAsBlob,
  Credentials,
  filterByExtension,
  Config,
  ImplementationFile,
  getPreviewStatus,
  UnpublishedEntryMediaFile,
  runWithLock,
  blobToFileObj,
  contentKeyFromBranch,
  unsentRequest,
  branchFromContentKey,
} from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';
import { Octokit } from '@octokit/rest';
import API, { Entry, API_NAME } from './API';
import GraphQLAPI from './GraphQLAPI';

type GitHubUser = Octokit.UsersGetAuthenticatedResponse;

const MAX_CONCURRENT_DOWNLOADS = 10;

type ApiFile = { id: string; type: string; name: string; path: string; size: number };

const { fetchWithTimeout: fetch } = unsentRequest;

const STATUS_PAGE = 'https://www.githubstatus.com';
const GITHUB_STATUS_ENDPOINT = `${STATUS_PAGE}/api/v2/components.json`;
const GITHUB_OPERATIONAL_UNITS = ['API Requests', 'Issues, Pull Requests, Projects'];
type GitHubStatusComponent = {
  id: string;
  name: string;
  status: string;
};

export default class GitHub implements Implementation {
  lock: AsyncLock;
  api: API | null;
  options: {
    proxied: boolean;
    API: API | null;
    useWorkflow?: boolean;
    initialWorkflowStatus: string;
  };
  originRepo: string;
  repo?: string;
  openAuthoringEnabled: boolean;
  useOpenAuthoring?: boolean;
  branch: string;
  apiRoot: string;
  mediaFolder: string;
  previewContext: string;
  token: string | null;
  squashMerges: boolean;
  useGraphql: boolean;
  _currentUserPromise?: Promise<GitHubUser>;
  _userIsOriginMaintainerPromises?: {
    [key: string]: Promise<boolean>;
  };
  _mediaDisplayURLSem?: Semaphore;

  constructor(config: Config, options = {}) {
    this.options = {
      proxied: false,
      API: null,
      initialWorkflowStatus: '',
      ...options,
    };

    if (
      !this.options.proxied &&
      (config.backend.repo === null || config.backend.repo === undefined)
    ) {
      throw new Error('The GitHub backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.openAuthoringEnabled = config.backend.open_authoring || false;
    if (this.openAuthoringEnabled) {
      if (!this.options.useWorkflow) {
        throw new Error(
          'backend.open_authoring is true but publish_mode is not set to editorial_workflow.',
        );
      }
      this.originRepo = config.backend.repo || '';
    } else {
      this.repo = this.originRepo = config.backend.repo || '';
    }
    this.branch = config.backend.branch?.trim() || 'master';
    this.apiRoot = config.backend.api_root || 'https://api.github.com';
    this.token = '';
    this.squashMerges = config.backend.squash_merges || false;
    this.useGraphql = config.backend.use_graphql || false;
    this.mediaFolder = config.media_folder;
    this.previewContext = config.backend.preview_context || '';
    this.lock = asyncLock();
  }

  isGitBackend() {
    return true;
  }

  async status() {
    const api = await fetch(GITHUB_STATUS_ENDPOINT)
      .then(res => res.json())
      .then(res => {
        return res['components']
          .filter((statusComponent: GitHubStatusComponent) =>
            GITHUB_OPERATIONAL_UNITS.includes(statusComponent.name),
          )
          .every(
            (statusComponent: GitHubStatusComponent) => statusComponent.status === 'operational',
          );
      })
      .catch(e => {
        console.warn('Failed getting GitHub status', e);
        return true;
      });

    let auth = false;
    // no need to check auth if api is down
    if (api) {
      auth =
        (await this.api
          ?.getUser()
          .then(user => !!user)
          .catch(e => {
            console.warn('Failed getting GitHub user', e);
            return false;
          })) || false;
    }

    return { auth: { status: auth }, api: { status: api, statusPage: STATUS_PAGE } };
  }

  authComponent() {
    const wrappedAuthenticationPage = (props: Record<string, unknown>) => (
      <AuthenticationPage {...props} backend={this} />
    );
    wrappedAuthenticationPage.displayName = 'AuthenticationPage';
    return wrappedAuthenticationPage;
  }

  restoreUser(user: User) {
    return this.openAuthoringEnabled
      ? this.authenticateWithFork({ userData: user, getPermissionToFork: () => true }).then(() =>
          this.authenticate(user),
        )
      : this.authenticate(user);
  }

  async pollUntilForkExists({ repo, token }: { repo: string; token: string }) {
    const pollDelay = 250; // milliseconds
    let repoExists = false;
    while (!repoExists) {
      repoExists = await fetch(`${this.apiRoot}/repos/${repo}`, {
        headers: { Authorization: `token ${token}` },
      })
        .then(() => true)
        .catch(err => {
          if (err && err.status === 404) {
            console.log('This 404 was expected and handled appropriately.');
            return false;
          } else {
            return Promise.reject(err);
          }
        });
      // wait between polls
      if (!repoExists) {
        await new Promise(resolve => setTimeout(resolve, pollDelay));
      }
    }
    return Promise.resolve();
  }

  async currentUser({ token }: { token: string }) {
    if (!this._currentUserPromise) {
      this._currentUserPromise = fetch(`${this.apiRoot}/user`, {
        headers: {
          Authorization: `token ${token}`,
        },
      }).then(res => res.json());
    }
    return this._currentUserPromise;
  }

  async userIsOriginMaintainer({
    username: usernameArg,
    token,
  }: {
    username?: string;
    token: string;
  }) {
    const username = usernameArg || (await this.currentUser({ token })).login;
    this._userIsOriginMaintainerPromises = this._userIsOriginMaintainerPromises || {};
    if (!this._userIsOriginMaintainerPromises[username]) {
      this._userIsOriginMaintainerPromises[username] = fetch(
        `${this.apiRoot}/repos/${this.originRepo}/collaborators/${username}/permission`,
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

  async forkExists({ token }: { token: string }) {
    try {
      const currentUser = await this.currentUser({ token });
      const repoName = this.originRepo.split('/')[1];
      const repo = await fetch(`${this.apiRoot}/repos/${currentUser.login}/${repoName}`, {
        method: 'GET',
        headers: {
          Authorization: `token ${token}`,
        },
      }).then(res => res.json());

      // https://developer.github.com/v3/repos/#get
      // The parent and source objects are present when the repository is a fork.
      // parent is the repository this repository was forked from, source is the ultimate source for the network.
      const forkExists =
        repo.fork === true &&
        repo.parent &&
        repo.parent.full_name.toLowerCase() === this.originRepo.toLowerCase();
      return forkExists;
    } catch {
      return false;
    }
  }

  async authenticateWithFork({
    userData,
    getPermissionToFork,
  }: {
    userData: User;
    getPermissionToFork: () => Promise<boolean> | boolean;
  }) {
    if (!this.openAuthoringEnabled) {
      throw new Error('Cannot authenticate with fork; Open Authoring is turned off.');
    }
    const token = userData.token as string;

    // Origin maintainers should be able to use the CMS normally
    if (await this.userIsOriginMaintainer({ token })) {
      this.repo = this.originRepo;
      this.useOpenAuthoring = false;
      return Promise.resolve();
    }

    if (!(await this.forkExists({ token }))) {
      await getPermissionToFork();
    }

    const fork = await fetch(`${this.apiRoot}/repos/${this.originRepo}/forks`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
      },
    }).then(res => res.json());
    this.useOpenAuthoring = true;
    this.repo = fork.full_name;
    return this.pollUntilForkExists({ repo: fork.full_name, token });
  }

  async authenticate(state: Credentials) {
    this.token = state.token as string;
    const apiCtor = this.useGraphql ? GraphQLAPI : API;
    this.api = new apiCtor({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      originRepo: this.originRepo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      useOpenAuthoring: this.useOpenAuthoring,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
    });
    const user = await this.api!.user();
    const isCollab = await this.api!.hasWriteAccess().catch(error => {
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
    return { ...user, token: state.token as string, useOpenAuthoring: this.useOpenAuthoring };
  }

  logout() {
    this.token = null;
    if (this.api && this.api.reset && typeof this.api.reset === 'function') {
      return this.api.reset();
    }
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  getCursorAndFiles = (files: ApiFile[], page: number) => {
    const pageSize = 20;
    const count = files.length;
    const pageCount = Math.ceil(files.length / pageSize);

    const actions = [] as string[];
    if (page > 1) {
      actions.push('prev');
      actions.push('first');
    }
    if (page < pageCount) {
      actions.push('next');
      actions.push('last');
    }

    const cursor = Cursor.create({
      actions,
      meta: { page, count, pageSize, pageCount },
      data: { files },
    });
    const pageFiles = files.slice((page - 1) * pageSize, page * pageSize);
    return { cursor, files: pageFiles };
  };

  async entriesByFolder(folder: string, extension: string, depth: number) {
    const repoURL = this.api!.originRepoURL;

    let cursor: Cursor;

    const listFiles = () =>
      this.api!.listFiles(folder, {
        repoURL,
        depth,
      }).then(files => {
        const filtered = files.filter(file => filterByExtension(file, extension));
        const result = this.getCursorAndFiles(filtered, 1);
        cursor = result.cursor;
        return result.files;
      });

    const readFile = (path: string, id: string | null | undefined) =>
      this.api!.readFile(path, id, { repoURL }) as Promise<string>;

    const files = await entriesByFolder(
      listFiles,
      readFile,
      this.api!.readFileMetadata.bind(this.api),
      API_NAME,
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    files[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return files;
  }

  async allEntriesByFolder(folder: string, extension: string, depth: number) {
    const repoURL = this.api!.originRepoURL;

    const listFiles = () =>
      this.api!.listFiles(folder, {
        repoURL,
        depth,
      }).then(files => files.filter(file => filterByExtension(file, extension)));

    const readFile = (path: string, id: string | null | undefined) => {
      return this.api!.readFile(path, id, { repoURL }) as Promise<string>;
    };

    const files = await entriesByFolder(
      listFiles,
      readFile,
      this.api!.readFileMetadata.bind(this.api),
      API_NAME,
    );
    return files;
  }

  entriesByFiles(files: ImplementationFile[]) {
    const repoURL = this.useOpenAuthoring ? this.api!.originRepoURL : this.api!.repoURL;

    const readFile = (path: string, id: string | null | undefined) =>
      this.api!.readFile(path, id, { repoURL }).catch(() => '') as Promise<string>;

    return entriesByFiles(files, readFile, this.api!.readFileMetadata.bind(this.api), API_NAME);
  }

  // Fetches a single entry.
  getEntry(path: string) {
    const repoURL = this.api!.originRepoURL;
    return this.api!.readFile(path, null, { repoURL })
      .then(data => ({
        file: { path, id: null },
        data: data as string,
      }))
      .catch(() => ({ file: { path, id: null }, data: '' }));
  }

  getMedia(mediaFolder = this.mediaFolder) {
    return this.api!.listFiles(mediaFolder).then(files =>
      files.map(({ id, name, size, path }) => {
        // load media using getMediaDisplayURL to avoid token expiration with GitHub raw content urls
        // for private repositories
        return { id, name, size, displayURL: { id, path }, path };
      }),
    );
  }

  async getMediaFile(path: string) {
    const blob = await getMediaAsBlob(path, null, this.api!.readFile.bind(this.api!));

    const name = basename(path);
    const fileObj = blobToFileObj(name, blob);
    const url = URL.createObjectURL(fileObj);
    const id = await getBlobSHA(blob);

    return {
      id,
      displayURL: url,
      path,
      name,
      size: fileObj.size,
      file: fileObj,
      url,
    };
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || semaphore(MAX_CONCURRENT_DOWNLOADS);
    return getMediaDisplayURL(
      displayURL,
      this.api!.readFile.bind(this.api!),
      this._mediaDisplayURLSem,
    );
  }

  persistEntry(entry: Entry, mediaFiles: AssetProxy[] = [], options: PersistOptions) {
    // persistEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.persistFiles(entry, mediaFiles, options),
      'Failed to acquire persist entry lock',
    );
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    try {
      await this.api!.persistFiles(null, [mediaFile], options);
      const { sha, path, fileObj } = mediaFile as AssetProxy & { sha: string };
      const displayURL = URL.createObjectURL(fileObj);
      return {
        id: sha,
        name: fileObj!.name,
        size: fileObj!.size,
        displayURL,
        path: trimStart(path, '/'),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  deleteFile(path: string, commitMessage: string) {
    return this.api!.deleteFile(path, commitMessage);
  }

  async traverseCursor(cursor: Cursor, action: string) {
    const meta = cursor.meta!;
    const files = cursor.data!.get('files')!.toJS() as ApiFile[];

    let result: { cursor: Cursor; files: ApiFile[] };
    switch (action) {
      case 'first': {
        result = this.getCursorAndFiles(files, 1);
        break;
      }
      case 'last': {
        result = this.getCursorAndFiles(files, meta.get('pageCount'));
        break;
      }
      case 'next': {
        result = this.getCursorAndFiles(files, meta.get('page') + 1);
        break;
      }
      case 'prev': {
        result = this.getCursorAndFiles(files, meta.get('page') - 1);
        break;
      }
      default: {
        result = this.getCursorAndFiles(files, 1);
        break;
      }
    }

    const readFile = (path: string, id: string | null | undefined) =>
      this.api!.readFile(path, id, { repoURL: this.api!.originRepoURL }).catch(() => '') as Promise<
        string
      >;

    const entries = await entriesByFiles(
      result.files,
      readFile,
      this.api!.readFileMetadata.bind(this.api),
      API_NAME,
    );

    return {
      entries,
      cursor: result.cursor,
    };
  }

  async loadMediaFile(branch: string, file: UnpublishedEntryMediaFile) {
    const readFile = (
      path: string,
      id: string | null | undefined,
      { parseText }: { parseText: boolean },
    ) => this.api!.readFile(path, id, { branch, parseText });

    const blob = await getMediaAsBlob(file.path, file.id, readFile);
    const name = basename(file.path);
    const fileObj = blobToFileObj(name, blob);
    return {
      id: file.id,
      displayURL: URL.createObjectURL(fileObj),
      path: file.path,
      name,
      size: fileObj.size,
      file: fileObj,
    };
  }

  async unpublishedEntries() {
    const listEntriesKeys = () =>
      this.api!.listUnpublishedBranches().then(branches =>
        branches.map(branch => contentKeyFromBranch(branch)),
      );

    const ids = await unpublishedEntries(listEntriesKeys);
    return ids;
  }

  async unpublishedEntry({
    id,
    collection,
    slug,
  }: {
    id?: string;
    collection?: string;
    slug?: string;
  }) {
    if (id) {
      const data = await this.api!.retrieveUnpublishedEntryData(id);
      return data;
    } else if (collection && slug) {
      const entryId = this.api!.generateContentKey(collection, slug);
      const data = await this.api!.retrieveUnpublishedEntryData(entryId);
      return data;
    } else {
      throw new Error('Missing unpublished entry id or collection and slug');
    }
  }

  getBranch(collection: string, slug: string) {
    const contentKey = this.api!.generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);
    return branch;
  }

  async unpublishedEntryDataFile(collection: string, slug: string, path: string, id: string) {
    const branch = this.getBranch(collection, slug);
    const data = (await this.api!.readFile(path, id, { branch })) as string;
    return data;
  }

  async unpublishedEntryMediaFile(collection: string, slug: string, path: string, id: string) {
    const branch = this.getBranch(collection, slug);
    const mediaFile = await this.loadMediaFile(branch, { path, id });
    return mediaFile;
  }

  async getDeployPreview(collection: string, slug: string) {
    try {
      const statuses = await this.api!.getStatuses(collection, slug);
      const deployStatus = getPreviewStatus(statuses, this.previewContext);

      if (deployStatus) {
        const { target_url: url, state } = deployStatus;
        return { url, status: state };
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    // updateUnpublishedEntryStatus is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.updateUnpublishedEntryStatus(collection, slug, newStatus),
      'Failed to acquire update entry status lock',
    );
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    // deleteUnpublishedEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.deleteUnpublishedEntry(collection, slug),
      'Failed to acquire delete entry lock',
    );
  }

  publishUnpublishedEntry(collection: string, slug: string) {
    // publishUnpublishedEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.publishUnpublishedEntry(collection, slug),
      'Failed to acquire publish entry lock',
    );
  }
}
