import trimStart from 'lodash/trimStart';
import semaphore, { Semaphore } from 'semaphore';
import { trim } from 'lodash';
import { stripIndent } from 'common-tags';
import {
  CURSOR_COMPATIBILITY_SYMBOL,
  basename,
  Entry,
  AssetProxy,
  PersistOptions,
  Cursor,
  Implementation,
  DisplayURL,
  entriesByFolder,
  entriesByFiles,
  getMediaDisplayURL,
  getMediaAsBlob,
  User,
  Credentials,
  Config,
  ImplementationFile,
  unpublishedEntries,
  getPreviewStatus,
  UnpublishedEntryMediaFile,
  asyncLock,
  AsyncLock,
  runWithLock,
} from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';
import API, { API_NAME } from './API';
import { getBlobSHA } from 'netlify-cms-lib-util/src';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitLab implements Implementation {
  lock: AsyncLock;
  api: API | null;
  options: {
    proxied: boolean;
    API: API | null;
    initialWorkflowStatus: string;
  };
  repo: string;
  branch: string;
  apiRoot: string;
  token: string | null;
  squashMerges: boolean;
  mediaFolder: string;
  previewContext: string;

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
      throw new Error('The GitLab backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.repo = config.backend.repo || '';
    this.branch = config.backend.branch || 'master';
    this.apiRoot = config.backend.api_root || 'https://gitlab.com/api/v4';
    this.token = '';
    this.squashMerges = config.backend.squash_merges || false;
    this.mediaFolder = config.media_folder;
    this.previewContext = config.backend.preview_context || '';
    this.lock = asyncLock();
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user: User) {
    return this.authenticate(user);
  }

  async authenticate(state: Credentials) {
    this.token = state.token as string;
    this.api = new API({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
    });
    const user = await this.api.user();
    const isCollab = await this.api.hasWriteAccess().catch((error: Error) => {
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
    return { ...user, login: user.username, token: state.token as string };
  }

  async logout() {
    this.token = null;
    return;
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  filterFile(
    folder: string,
    file: { path: string; name: string },
    extension: string,
    depth: number,
  ) {
    // gitlab paths include the root folder
    const fileFolder = trim(file.path.split(folder)[1] || '/', '/');
    return file.name.endsWith('.' + extension) && fileFolder.split('/').length <= depth;
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    let cursor: Cursor;

    const listFiles = () =>
      this.api!.listFiles(folder, depth > 1).then(({ files, cursor: c }) => {
        cursor = c;
        return files.filter(file => this.filterFile(folder, file, extension, depth));
      });

    const files = await entriesByFolder(listFiles, this.api!.readFile.bind(this.api!), API_NAME);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    files[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return files;
  }

  async allEntriesByFolder(folder: string, extension: string, depth: number) {
    const listFiles = () =>
      this.api!.listAllFiles(folder, depth > 1).then(files =>
        files.filter(file => this.filterFile(folder, file, extension, depth)),
      );

    const files = await entriesByFolder(listFiles, this.api!.readFile.bind(this.api!), API_NAME);
    return files;
  }

  entriesByFiles(files: ImplementationFile[]) {
    return entriesByFiles(files, this.api!.readFile.bind(this.api!), API_NAME);
  }

  // Fetches a single entry.
  getEntry(path: string) {
    return this.api!.readFile(path).then(data => ({
      file: { path, id: null },
      data: data as string,
    }));
  }

  getMedia(mediaFolder = this.mediaFolder) {
    return this.api!.listAllFiles(mediaFolder).then(files =>
      files.map(({ id, name, path }) => {
        return { id, name, path, displayURL: { id, name, path } };
      }),
    );
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || semaphore(MAX_CONCURRENT_DOWNLOADS);
    return getMediaDisplayURL(
      displayURL,
      this.api!.readFile.bind(this.api!),
      this._mediaDisplayURLSem,
    );
  }

  async getMediaFile(path: string) {
    const name = basename(path);
    const blob = await getMediaAsBlob(path, null, this.api!.readFile.bind(this.api!));
    const fileObj = new File([blob], name);
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

  async persistEntry(entry: Entry, mediaFiles: AssetProxy[], options: PersistOptions) {
    // persistEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.persistFiles(entry, mediaFiles, options),
      'Failed to acquire persist entry lock',
    );
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    const fileObj = mediaFile.fileObj as File;

    const [id] = await Promise.all([
      getBlobSHA(fileObj),
      this.api!.persistFiles(null, [mediaFile], options),
    ]);

    const { path } = mediaFile;
    const url = URL.createObjectURL(fileObj);

    return {
      displayURL: url,
      path: trimStart(path, '/'),
      name: fileObj!.name,
      size: fileObj!.size,
      file: fileObj,
      url,
      id,
    };
  }

  deleteFile(path: string, commitMessage: string) {
    return this.api!.deleteFile(path, commitMessage);
  }

  traverseCursor(cursor: Cursor, action: string) {
    return this.api!.traverseCursor(cursor, action).then(
      async ({ entries, cursor: newCursor }) => ({
        entries: await Promise.all(
          entries.map(file =>
            this.api!.readFile(file.path, file.id).then(data => ({ file, data: data as string })),
          ),
        ),
        cursor: newCursor,
      }),
    );
  }

  loadMediaFile(branch: string, file: UnpublishedEntryMediaFile) {
    const readFile = (
      path: string,
      id: string | null | undefined,
      { parseText }: { parseText: boolean },
    ) => this.api!.readFile(path, id, { branch, parseText });

    return getMediaAsBlob(file.path, null, readFile).then(blob => {
      const name = basename(file.path);
      const fileObj = new File([blob], name);
      return {
        id: file.path,
        displayURL: URL.createObjectURL(fileObj),
        path: file.path,
        name,
        size: fileObj.size,
        file: fileObj,
      };
    });
  }

  async loadEntryMediaFiles(branch: string, files: UnpublishedEntryMediaFile[]) {
    const mediaFiles = await Promise.all(files.map(file => this.loadMediaFile(branch, file)));

    return mediaFiles;
  }

  async unpublishedEntries() {
    const listEntriesKeys = () =>
      this.api!.listUnpublishedBranches().then(branches =>
        branches.map(branch => this.api!.contentKeyFromBranch(branch)),
      );

    const readUnpublishedBranchFile = (contentKey: string) =>
      this.api!.readUnpublishedBranchFile(contentKey);

    return unpublishedEntries(listEntriesKeys, readUnpublishedBranchFile, API_NAME);
  }

  async unpublishedEntry(
    collection: string,
    slug: string,
    combineKey: string | undefined,
    {
      loadEntryMediaFiles = (branch: string, files: UnpublishedEntryMediaFile[]) =>
        this.loadEntryMediaFiles(branch, files),
    } = {},
  ) {
    const contentKey = combineKey || this.api!.generateContentKey(collection, slug);
    return await this.api!.readUnpublishedBranchFile(contentKey, loadEntryMediaFiles);
  }

  async unpublishedCombineEntry(combineKey: string, path: string) {
    return await this.unpublishedEntry('', '', combineKey).then(entries =>
      entries.find(entry => entry.file.path === path),
    );
  }

  async combineColletionEntry(combineArgs, entries) {
    //  combineColletionEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.combineColletionEntry(combineArgs, entries),
      'Failed to acquire combine entry  lock',
    );
  }

  async updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    // updateUnpublishedEntryStatus is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.updateUnpublishedEntryStatus(collection, slug, newStatus),
      'Failed to acquire update entry status lock',
    );
  }

  async deleteUnpublishedEntry(collection: string, slug: string) {
    // deleteUnpublishedEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.deleteUnpublishedEntry(collection, slug),
      'Failed to acquire delete entry lock',
    );
  }

  async publishUnpublishedEntry(collection: string, slug: string) {
    // publishUnpublishedEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.publishUnpublishedEntry(collection, slug),
      'Failed to acquire publish entry lock',
    );
  }

  async getDeployPreview(collection: string, slug: string, combineKey: string) {
    try {
      const statuses = await this.api!.getStatuses(collection, slug, combineKey);
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
}
