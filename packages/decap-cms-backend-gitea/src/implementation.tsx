import { stripIndent } from 'common-tags';
import trimStart from 'lodash/trimStart';
import semaphore from 'semaphore';
import {
  asyncLock,
  basename,
  blobToFileObj,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  entriesByFiles,
  entriesByFolder,
  filterByExtension,
  getBlobSHA,
  getMediaAsBlob,
  getMediaDisplayURL,
  runWithLock,
  unsentRequest,
} from 'decap-cms-lib-util';

import API, { API_NAME } from './API';
import AuthenticationPage from './AuthenticationPage';

import type {
  AssetProxy,
  AsyncLock,
  Config,
  Credentials,
  DisplayURL,
  Entry,
  Implementation,
  ImplementationFile,
  PersistOptions,
  User,
} from 'decap-cms-lib-util';
import type { Semaphore } from 'semaphore';
import type { GiteaUser } from './types';

const MAX_CONCURRENT_DOWNLOADS = 10;

type ApiFile = { id: string; type: string; name: string; path: string; size: number };

const { fetchWithTimeout: fetch } = unsentRequest;

export default class Gitea implements Implementation {
  lock: AsyncLock;
  api: API | null;
  options: {
    proxied: boolean;
    API: API | null;
    useWorkflow?: boolean;
  };
  originRepo: string;
  repo?: string;
  branch: string;
  apiRoot: string;
  mediaFolder?: string;
  token: string | null;
  _currentUserPromise?: Promise<GiteaUser>;
  _userIsOriginMaintainerPromises?: {
    [key: string]: Promise<boolean>;
  };
  _mediaDisplayURLSem?: Semaphore;

  constructor(config: Config, options = {}) {
    this.options = {
      proxied: false,
      API: null,
      useWorkflow: false,
      ...options,
    };

    if (
      !this.options.proxied &&
      (config.backend.repo === null || config.backend.repo === undefined)
    ) {
      throw new Error('The Gitea backend needs a "repo" in the backend configuration.');
    }

    if (this.options.useWorkflow) {
      throw new Error('The Gitea backend does not support editorial workflow.');
    }

    this.api = this.options.API || null;
    this.repo = this.originRepo = config.backend.repo || '';
    this.branch = config.backend.branch?.trim() || 'master';
    this.apiRoot = config.backend.api_root || 'https://try.gitea.io/api/v1';
    this.token = '';
    this.mediaFolder = config.media_folder;
    this.lock = asyncLock();
  }

  isGitBackend() {
    return true;
  }

  async status() {
    const auth =
      (await this.api
        ?.user()
        .then(user => !!user)
        .catch(e => {
          console.warn('[StaticCMS] Failed getting Gitea user', e);
          return false;
        })) || false;

    return { auth: { status: auth }, api: { status: true, statusPage: '' } };
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user: User) {
    return this.authenticate(user);
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

  async authenticate(state: Credentials) {
    this.token = state.token as string;
    const apiCtor = API;
    this.api = new apiCtor({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      originRepo: this.originRepo,
      apiRoot: this.apiRoot,
    });
    const user = await this.api!.user();
    const isCollab = await this.api!.hasWriteAccess().catch(error => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If the repo is private, make sure you're logged into a Gitea account with access.

        If your repo is under an organization, ensure the organization has granted access to Static
        CMS.
      `;
      throw error;
    });

    // Unauthorized user
    if (!isCollab) {
      throw new Error('Your Gitea user account does not have access to this repo.');
    }

    // Authorized user
    return {
      name: user.full_name,
      login: user.login,
      avatar_url: user.avatar_url,
      token: state.token as string,
    };
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
    const repoURL = this.api!.repoURL;

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

  async getMedia(mediaFolder = this.mediaFolder, folderSupport?: boolean) {
    if (!mediaFolder) {
      return [];
    }
    return this.api!.listFiles(mediaFolder, undefined, folderSupport).then(files =>
      files.map(({ id, name, size, path, type }) => {
        return { id, name, size, displayURL: { id, path }, path, isDirectory: type === 'tree' };
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

  persistEntry(entry: Entry, options: PersistOptions) {
    // persistEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.persistFiles(entry.dataFiles, entry.assets, options),
      'Failed to acquire persist entry lock',
    );
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    try {
      await this.api!.persistFiles([], [mediaFile], options);
      const { sha, path, fileObj } = mediaFile as AssetProxy & { sha: string };
      const displayURL = URL.createObjectURL(fileObj as Blob);
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

  deleteFiles(paths: string[], commitMessage: string) {
    return this.api!.deleteFiles(paths, commitMessage);
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
      this.api!.readFile(path, id, { repoURL: this.api!.originRepoURL }).catch(
        () => '',
      ) as Promise<string>;

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

  async unpublishedEntries() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {} as any;
  }

  async unpublishedEntry() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {} as any;
  }

  async unpublishedEntryDataFile() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {} as any;
  }

  async unpublishedEntryMediaFile() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {} as any;
  }

  async updateUnpublishedEntryStatus() {
    return;
  }

  async publishUnpublishedEntry() {
    return;
  }
  async deleteUnpublishedEntry() {
    return;
  }

  async getDeployPreview() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {} as any;
  }
}
