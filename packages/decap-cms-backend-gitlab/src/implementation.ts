import trimStart from 'lodash/trimStart';
import semaphore from 'semaphore';
import trim from 'lodash/trim';
import { stripIndent } from 'common-tags';
import {
  NotesPollingManager,
  markOwnNotes,
  CURSOR_COMPATIBILITY_SYMBOL,
  basename,
  entriesByFolder,
  entriesByFiles,
  getMediaDisplayURL,
  getMediaAsBlob,
  unpublishedEntries,
  getPreviewStatus,
  asyncLock,
  runWithLock,
  getBlobSHA,
  blobToFileObj,
  contentKeyFromBranch,
  generateContentKey,
  localForage,
  allEntriesByFolder,
  filterByExtension,
  branchFromContentKey,
  getDefaultBranchName,
  unsentRequest,
  AccessTokenError,
} from 'decap-cms-lib-util';
import { PkceAuthenticator } from 'decap-cms-lib-auth';

import AuthenticationPage from './AuthenticationPage';
import API, { API_NAME } from './API';
import { GitLabNotesAPI } from './notesApi';

import type {
  Note,
  IssueChange,
  Entry,
  AssetProxy,
  PersistOptions,
  Cursor,
  Implementation,
  DisplayURL,
  User,
  Credentials,
  Config,
  ImplementationFile,
  UnpublishedEntryMediaFile,
  AsyncLock,
  ApiRequest,
} from 'decap-cms-lib-util';
import type { Semaphore } from 'semaphore';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitLab implements Implementation {
  notesApi?: GitLabNotesAPI;
  pollingManager?: NotesPollingManager;
  private unwatchNotes = new Map<string, () => void>();
  private notesUserPromise?: Promise<{ username?: string; name?: string }>;

  lock: AsyncLock;
  api: API | null;
  updateUserCredentials: (args: { token: string; refresh_token?: string }) => Promise<null>;
  options: {
    proxied: boolean;
    API: API | null;
    updateUserCredentials: (args: { token: string; refresh_token?: string }) => Promise<null>;
    initialWorkflowStatus: string;
  };
  repo: string;
  isBranchConfigured: boolean;
  branch: string;
  apiRoot: string;
  token: string | null;
  squashMerges: boolean;
  cmsLabelPrefix: string;
  mediaFolder: string;
  previewContext: string;
  useGraphQL: boolean;
  graphQLAPIRoot: string;
  authType: string;
  baseUrl: string;
  authEndpoint: string;
  appID: string;
  refreshToken?: string;
  refreshedTokenPromise?: Promise<string>;
  authenticator?: PkceAuthenticator;

  _mediaDisplayURLSem?: Semaphore;

  constructor(config: Config, options = {}) {
    this.options = {
      proxied: false,
      API: null,
      updateUserCredentials: async () => null,
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

    this.updateUserCredentials = this.options.updateUserCredentials;

    this.repo = config.backend.repo || '';
    this.branch = config.backend.branch || 'master';
    this.isBranchConfigured = config.backend.branch ? true : false;
    this.apiRoot = config.backend.api_root || 'https://gitlab.com/api/v4';
    this.token = '';
    this.squashMerges = config.backend.squash_merges || false;
    this.cmsLabelPrefix = config.backend.cms_label_prefix || '';
    this.mediaFolder = config.media_folder;
    this.previewContext = config.backend.preview_context || '';
    this.useGraphQL = config.backend.use_graphql || false;
    this.graphQLAPIRoot = config.backend.graphql_api_root || 'https://gitlab.com/api/graphql';
    this.authType = config.backend.auth_type || '';
    this.baseUrl = config.backend.base_url || 'https://gitlab.com';
    this.authEndpoint = config.backend.auth_endpoint || 'oauth/authorize';
    this.appID = config.backend.app_id || '';
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
          console.warn('Failed getting GitLab user', e);
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

  async authenticate(state: Credentials) {
    this.token = state.token as string;
    this.refreshToken = state.refresh_token;
    this.api = new API({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
      useGraphQL: this.useGraphQL,
      graphQLAPIRoot: this.graphQLAPIRoot,
      requestFunction: this.apiRequestFunction,
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

    if (!this.isBranchConfigured) {
      const defaultBranchName = await getDefaultBranchName({
        backend: 'gitlab',
        repo: this.repo,
        token: this.token,
        apiRoot: this.apiRoot,
      });
      if (defaultBranchName) {
        this.branch = defaultBranchName;
      }
    }
    this.destroyNotesPolling();
    this.notesApi = new GitLabNotesAPI(this.api);
    this.pollingManager = new NotesPollingManager(this.notesApi.asPollingAPI(), 15000);

    // Authorized user
    return {
      ...user,
      login: user.username,
      token: this.token as string,
      refresh_token: this.refreshToken,
    };
  }

  getRefreshedAccessToken() {
    if (this.authType !== 'pkce' || !this.refreshToken) {
      throw new AccessTokenError(`Can't refresh access token when using implicit auth`);
    }
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }

    if (!this.authenticator) {
      this.authenticator = new PkceAuthenticator({
        base_url: this.baseUrl,
        auth_endpoint: this.authEndpoint,
        app_id: this.appID,
        auth_token_endpoint: 'oauth/token',
        auth_token_endpoint_content_type: 'application/json; charset=utf-8',
      });
    }

    this.refreshedTokenPromise = this.authenticator!.refresh({
      refresh_token: this.refreshToken,
    }).then(({ token, refresh_token }) => {
      this.token = token;
      this.refreshToken = refresh_token;
      this.refreshedTokenPromise = undefined;

      this.updateUserCredentials({ token, refresh_token });
      if (this.api) {
        this.api.token = token;
      }
      return token;
    });

    return this.refreshedTokenPromise;
  }

  private destroyNotesPolling() {
    this.pollingManager?.destroy();
    this.pollingManager = undefined;
    this.unwatchNotes.clear();
    this.notesUserPromise = undefined;
  }

  async logout() {
    this.token = null;
    this.destroyNotesPolling();
    return;
  }

  getToken() {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }

    return Promise.resolve(this.token);
  }

  apiRequestFunction = async (req: ApiRequest) => {
    const token = (
      this.refreshedTokenPromise ? await this.refreshedTokenPromise : this.token
    ) as string;

    const authorizedRequest = unsentRequest.withHeaders({ Authorization: `Bearer ${token}` }, req);
    const response: Response = await unsentRequest.performRequest(authorizedRequest);
    if (response.status === 401) {
      const json = await response
        .clone()
        .json()
        .catch(() => null);
      const isInvalidToken =
        json &&
        (json.error === 'invalid_token' ||
          json.message === '401 Unauthorized' ||
          (Array.isArray(json.errors) &&
            json.errors.some(({ message }: { message?: string }) => message === 'Invalid token')));
      if (isInvalidToken) {
        const newToken = await this.getRefreshedAccessToken();
        const reqWithNewToken = unsentRequest.withHeaders(
          {
            Authorization: `Bearer ${newToken}`,
          },
          req,
        ) as ApiRequest;
        return unsentRequest.performRequest(reqWithNewToken);
      }
    }
    return response;
  };

  filterFile(
    folder: string,
    file: { path: string; name: string },
    extension: string,
    depth: number,
  ) {
    // gitlab paths include the root folder
    const fileFolder = trim(file.path.split(folder)[1] || '/', '/');
    return filterByExtension(file, extension) && fileFolder.split('/').length <= depth;
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    let cursor: Cursor;

    const listFiles = () =>
      this.api!.listFiles(folder, depth > 1).then(({ files, cursor: c }) => {
        cursor = c.mergeMeta({ folder, extension, depth });
        return files.filter(file => this.filterFile(folder, file, extension, depth));
      });

    const files = await entriesByFolder(
      listFiles,
      this.api!.readFile.bind(this.api!),
      this.api!.readFileMetadata.bind(this.api),
      API_NAME,
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    files[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return files;
  }

  async listAllFiles(folder: string, extension: string, depth: number) {
    const files = await this.api!.listAllFiles(folder, depth > 1);
    const filtered = files.filter(file => this.filterFile(folder, file, extension, depth));
    return filtered;
  }

  async allEntriesByFolder(folder: string, extension: string, depth: number) {
    const files = await allEntriesByFolder({
      listAllFiles: () => this.listAllFiles(folder, extension, depth),
      readFile: this.api!.readFile.bind(this.api!),
      readFileMetadata: this.api!.readFileMetadata.bind(this.api),
      apiName: API_NAME,
      branch: this.branch,
      localForage,
      folder,
      extension,
      depth,
      getDefaultBranch: () =>
        this.api!.getDefaultBranch().then(b => ({ name: b.name, sha: b.commit.id })),
      isShaExistsInBranch: this.api!.isShaExistsInBranch.bind(this.api!),
      getDifferences: (to, from) => this.api!.getDifferences(to, from),
      getFileId: path => this.api!.getFileId(path, this.branch),
      filterFile: file => this.filterFile(folder, file, extension, depth),
      customFetch: this.useGraphQL ? files => this.api!.readFilesGraphQL(files) : undefined,
    });

    return files;
  }

  entriesByFiles(files: ImplementationFile[]) {
    return entriesByFiles(
      files,
      this.api!.readFile.bind(this.api!),
      this.api!.readFileMetadata.bind(this.api),
      API_NAME,
    );
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
    const readMediaFile = (
      path: string,
      id: string | null | undefined,
      { parseText }: { parseText: boolean },
    ) => this.api!.readFile(path, id, { parseText, lfs: true });

    return getMediaDisplayURL(displayURL, readMediaFile, this._mediaDisplayURLSem);
  }

  async getMediaFile(path: string) {
    const name = basename(path);
    const readMediaFile = (
      path: string,
      id: string | null | undefined,
      { parseText }: { parseText: boolean },
    ) => this.api!.readFile(path, id, { parseText, lfs: true });
    const blob = await getMediaAsBlob(path, null, readMediaFile);
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

  async persistEntry(entry: Entry, options: PersistOptions) {
    // persistEntry is a transactional operation
    return runWithLock(
      this.lock,
      () => this.api!.persistFiles(entry.dataFiles, entry.assets, options),
      'Failed to acquire persist entry lock',
    );
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    const fileObj = mediaFile.fileObj as File;

    const [id] = await Promise.all([
      getBlobSHA(fileObj),
      this.api!.persistFiles([], [mediaFile], options),
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

  deleteFiles(paths: string[], commitMessage: string) {
    return this.api!.deleteFiles(paths, commitMessage);
  }

  traverseCursor(cursor: Cursor, action: string) {
    return this.api!.traverseCursor(cursor, action).then(async ({ entries, cursor: newCursor }) => {
      const [folder, depth, extension] = [
        cursor.meta?.get('folder') as string,
        cursor.meta?.get('depth') as number,
        cursor.meta?.get('extension') as string,
      ];
      if (folder && depth && extension) {
        entries = entries.filter(f => this.filterFile(folder, f, extension, depth));
        newCursor = newCursor.mergeMeta({ folder, extension, depth });
      }
      const entriesWithData = await entriesByFiles(
        entries,
        this.api!.readFile.bind(this.api!),
        this.api!.readFileMetadata.bind(this.api)!,
        API_NAME,
      );
      return {
        entries: entriesWithData,
        cursor: newCursor,
      };
    });
  }

  loadMediaFile(branch: string, file: UnpublishedEntryMediaFile) {
    const readFile = (
      path: string,
      id: string | null | undefined,
      { parseText }: { parseText: boolean },
    ) => this.api!.readFile(path, id, { branch, parseText, lfs: true });

    return getMediaAsBlob(file.path, null, readFile).then(blob => {
      const name = basename(file.path);
      const fileObj = blobToFileObj(name, blob);
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
      const entryId = generateContentKey(collection, slug);
      const data = await this.api!.retrieveUnpublishedEntryData(entryId);
      return data;
    } else {
      throw new Error('Missing unpublished entry id or collection and slug');
    }
  }

  getBranch(collection: string, slug: string) {
    const contentKey = generateContentKey(collection, slug);
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
      async () => {
        await this.api!.deleteUnpublishedEntry(collection, slug);
        // Best effort: losing the thread's label does not make the entry any
        // less deleted, and failing the delete over it would be worse.
        await this.notesApi?.closeEntryNotesIssue(collection, slug);
      },
      'Failed to acquire delete entry lock',
    );
  }

  async publishUnpublishedEntry(collection: string, slug: string) {
    // publishUnpublishedEntry is a transactional operation
    return runWithLock(
      this.lock,
      async () => {
        await this.api!.publishUnpublishedEntry(collection, slug);
        await this.notesApi?.closeIssueOnPublish(collection, slug);
      },
      'Failed to acquire publish entry lock',
    );
  }

  /**
   * Who the signed-in editor is, as a note records them. No id: GitLab reports
   * the current username on every read, so ownership follows a rename.
   */
  async noteAuthorIdentity(): Promise<{ author: string; authorId?: string }> {
    const user = await this.currentNotesUser();
    return { author: user.username || user.name || '', authorId: undefined };
  }

  private currentNotesUser() {
    if (!this.notesUserPromise) {
      const promise: Promise<{ username?: string; name?: string }> = this.api!.user();
      this.notesUserPromise = promise;
      promise.catch(() => {
        if (this.notesUserPromise === promise) {
          this.notesUserPromise = undefined;
        }
      });
    }
    return this.notesUserPromise;
  }

  /**
   * Resolved here rather than in the pane, because only the backend knows how
   * its own identities compare.
   */
  private async markOwnNotes(notes: Note[]): Promise<Note[]> {
    return markOwnNotes(notes, await this.noteAuthorIdentity());
  }

  async getNotes(collection: string, slug: string): Promise<Note[]> {
    const notes = (await this.notesApi!.getEntryNotes(collection, slug)).map(note => ({
      ...note,
      entrySlug: slug,
    }));

    try {
      return await this.markOwnNotes(notes);
    } catch (error) {
      console.warn('Failed to resolve note ownership:', error);
      return notes;
    }
  }

  async addNote(
    collection: string,
    slug: string,
    noteData: Omit<Note, 'id'>,
    entryTitle?: string,
  ): Promise<Note> {
    const identity = await this.noteAuthorIdentity();
    const note: Note = {
      ...noteData,
      id: `temp-${Date.now()}`,
      author: identity.author,
      authorId: identity.authorId,
      isOwn: true,
      entrySlug: slug,
      timestamp: noteData.timestamp || new Date().toISOString(),
      resolved: noteData.resolved || false,
    };

    const { commentId, issueUrl } = await this.notesApi!.addNoteToEntry(
      collection,
      slug,
      note,
      entryTitle,
    );

    return { ...note, id: commentId, issueUrl };
  }

  private async findNote(collection: string, slug: string, noteId: string) {
    const notes = await this.notesApi!.getEntryNotes(collection, slug);
    const note = notes.find(candidate => candidate.id === noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    return note;
  }

  async updateNote(
    collection: string,
    slug: string,
    noteId: string,
    updates: Partial<Note>,
  ): Promise<Note> {
    const note = await this.findNote(collection, slug, noteId);
    return this.applyNoteUpdate(collection, slug, note, updates);
  }

  private async applyNoteUpdate(
    collection: string,
    slug: string,
    note: Note,
    updates: Partial<Note>,
  ): Promise<Note> {
    const updated = { ...note, ...updates };
    await this.notesApi!.updateEntryNote(collection, slug, note.id, updated);
    return (await this.markOwnNotes([updated]))[0];
  }

  async deleteNote(collection: string, slug: string, noteId: string): Promise<void> {
    await this.notesApi!.deleteEntryNote(collection, slug, noteId);
  }

  async toggleNoteResolution(collection: string, slug: string, noteId: string): Promise<Note> {
    const note = await this.findNote(collection, slug, noteId);
    return this.applyNoteUpdate(collection, slug, note, { resolved: !note.resolved });
  }

  async reopenIssueForUnpublishedEntry(collection: string, slug: string) {
    await this.notesApi?.reopenIssueOnUnpublish(collection, slug);
  }

  async startNotesPolling(
    collection: string,
    slug: string,
    callbacks: {
      onUpdate: (notes: Note[], changes: IssueChange[]) => void;
      onChange?: (change: IssueChange) => void;
    },
  ): Promise<void> {
    if (!this.pollingManager) {
      return;
    }

    const key = `${collection}/${slug}`;
    if (this.pollingManager.getStatus().currentWatch === key) {
      return;
    }

    this.unwatchNotes.get(key)?.();
    this.unwatchNotes.delete(key);

    try {
      const unwatch = await this.pollingManager.watchIssueWithRetry(
        collection,
        slug,
        {
          ...callbacks,
          // Polled notes are rebuilt from the thread's comments and so arrive
          // without the ownership flag getNotes adds; without this a poll would
          // strip the actions off the editor's own notes moments after writing.
          prepareNotes: notes => this.markOwnNotes(notes),
        },
        5,
        2000,
      );
      this.unwatchNotes.set(key, unwatch);
    } catch (error) {
      console.error('[DecapNotes Polling] Failed to start polling after retries:', error);
    }
  }

  async stopNotesPolling(collection: string, slug: string): Promise<void> {
    const key = `${collection}/${slug}`;
    this.unwatchNotes.get(key)?.();
    this.unwatchNotes.delete(key);
    this.pollingManager?.stopWatching(collection, slug);
  }

  async refreshNotesNow(collection: string, slug: string): Promise<void> {
    await this.pollingManager?.checkIssueNow(collection, slug);
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
}
