import { trimStart } from 'lodash-es';
import * as React from 'react';

import { markOwnNotes, notesConfigured, NotesPollingManager, rawContent } from '@/lib/backend/index';
import { GitLfsClient } from '@/lib/util/git-lfs-client';
import { stripIndent } from '@/lib/util/index';
import {
  asyncLock,
  basename,
  blobToFileObj,
  branchFromContentKey,
  contentKeyFromBranch,
  createSemaphore,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  entriesByFiles,
  entriesByFolder,
  filterByExtension,
  getBlobSHA,
  getLargeMediaFilteredMediaFiles,
  getLargeMediaPatternsFromGitAttributesFile,
  getMediaAsBlob,
  getMediaDisplayURL,
  getPointerFileForMediaFileObj,
  getPreviewStatus,
  parsePointerFile,
  runWithLock,
  unpublishedEntries,
  unsentRequest,
} from '@/lib/util/index';
import API, { API_NAME } from './API';
import AuthenticationPage from './AuthenticationPage';

import type {
  BackendEntry,
  BackendFileRef,
  BackendImplementation,
  Note,
  NotesWatchCallbacks,
  PersistPayload,
} from '@/lib/backend/index';
import type {
  AsyncLock,
  CmsAssetProxy,
  CmsConfig,
  CmsCredentials,
  CmsDisplayURL,
  CmsEntry,
  CmsPersistOptions,
  CmsUnpublishedEntryMediaFile,
  CmsUser,
  CursorCompatibleEntries,
} from '@/lib/util/index';
import type { ApiRequest, FetchError, Semaphore } from '@/lib/util/index';
import type { AuthenticationPageProps } from '@/ui/default/AuthenticationPage';
import type { Endpoints } from '@octokit/types';

export type GitHubUser = Endpoints['GET /user']['response']['data'];

const MAX_CONCURRENT_DOWNLOADS = 10;

// Git LFS pointer files are tiny text files (typically well under 200 bytes); anything larger
// than this can't be a pointer file, so it's safe to skip the text-decode + parse attempt.
const MAX_POINTER_FILE_SIZE = 1024;
const LFS_POINTER_VERSION_PREFIX = 'version https://git-lfs.github.com/spec/v1';

type ApiFile = { id: string, type: string, name: string, path: string, size: number };
type ReadFile = (
  path: string,
  id: string | null | undefined,
  options: { parseText: boolean },
) => Promise<string | Blob>;

const { fetchWithTimeout: fetch } = unsentRequest;

const STATUS_PAGE = 'https://www.githubstatus.com';
const GITHUB_STATUS_ENDPOINT = `${STATUS_PAGE}/api/v2/components.json`;
const GITHUB_OPERATIONAL_UNITS = ['API Requests', 'Issues, Pull Requests, Projects'];
type GitHubStatusComponent = {
  id: string,
  name: string,
  status: string,
};

let registeredGraphQLAPI: typeof API | null = null;

/** How often the open entry's notes thread is checked for other editors' notes. */
const NOTES_POLLING_INTERVAL = 15000;

/**
 * Registers the API class used when the backend has `use_graphql` enabled. Wired up by
 * importing 'decap-cms/backends/github/graphql', which is a separate entry so
 * the GraphQL client libraries stay optional peer dependencies.
 */
export function registerGraphQLAPI(graphQLAPI: typeof API) {
  registeredGraphQLAPI = graphQLAPI;
}

export default class GitHub implements BackendImplementation {
  lock: AsyncLock;
  api: API | null;
  config: CmsConfig;
  options: {
    proxied: boolean,
    API: API | null,
    useWorkflow?: boolean,
    initialWorkflowStatus: string,
  };
  originRepo: string;
  isBranchConfigured: boolean;
  repo: string | undefined;
  openAuthoringEnabled: boolean;
  useOpenAuthoring: boolean | undefined;
  alwaysForkEnabled: boolean;
  branch: string;
  apiRoot: string;
  mediaFolder: string;
  previewContext: string;
  token: string | null;
  tokenKeyword: string;
  squashMerges: boolean;
  cmsLabelPrefix: string;
  useGraphql: boolean;
  baseUrl: string | undefined;
  bypassWriteAccessCheckForAppTokens = false;
  _currentUserPromise?: Promise<GitHubUser>;
  _userIsOriginMaintainerPromises?: {
    [key: string]: Promise<boolean>,
  };
  _mediaDisplayURLSem?: Semaphore;
  largeMediaURL: string;
  _largeMediaClientPromise?: Promise<GitLfsClient>;
  pollingManager: NotesPollingManager | undefined;
  unwatchFunctions = new Map<string, () => void>();

  constructor(config: CmsConfig, options = {}) {
    this.options = {
      proxied: false,
      API: null,
      initialWorkflowStatus: '',
      ...options,
    };
    this.config = config;

    if (
      !this.options.proxied
      && (config.backend.repo === null || config.backend.repo === undefined)
    ) {
      throw new Error('The GitHub backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;
    this.isBranchConfigured = config.backend.branch ? true : false;
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
    this.alwaysForkEnabled = config.backend.always_fork || false;
    this.branch = config.backend.branch?.trim() || 'master';
    this.apiRoot = config.backend.api_root || 'https://api.github.com';
    this.token = '';
    this.tokenKeyword = 'token';
    this.baseUrl = config.backend.base_url;
    this.squashMerges = config.backend.squash_merges || false;
    this.cmsLabelPrefix = config.backend.cms_label_prefix || '';
    this.useGraphql = config.backend.use_graphql || false;
    if (!config.media_folder) console.warn('No media_folder configured for GitHub backend, using root of repo');
    this.mediaFolder = config.media_folder!;
    this.previewContext = config.backend.preview_context || '';
    this.largeMediaURL = config.backend.large_media_url
      || `https://github.com/${this.originRepo}.git/info/lfs`;
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
          .filter((statusComponent: GitHubStatusComponent) => GITHUB_OPERATIONAL_UNITS.includes(statusComponent.name))
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
      auth = (await this.api
        ?.getUser({ token: this.token ?? '' })
        .then(user => !!user)
        .catch(e => {
          console.warn('Failed getting GitHub user', e);
          return false;
        })) || false;
    }

    return { auth: { status: auth }, api: { status: api, statusPage: STATUS_PAGE } };
  }

  private wrappedAuthComponent = Object.assign(
    (props: AuthenticationPageProps) => <AuthenticationPage {...props} backend={this} />,
    { displayName: 'AuthenticationPage' },
  );

  authComponent() {
    return this.wrappedAuthComponent;
  }

  restoreUser(user: CmsUser) {
    return this.openAuthoringEnabled
      ? this.authenticateWithFork({ userData: user, getPermissionToFork: () => true }).then(() =>
        this.authenticate(user)
      )
      : this.authenticate(user);
  }

  async pollUntilForkExists({ repo, token }: { repo: string, token: string }) {
    const pollDelay = 250; // milliseconds
    let repoExists = false;
    while (!repoExists) {
      repoExists = await fetch(`${this.apiRoot}/repos/${repo}`, {
        headers: { Authorization: `${this.tokenKeyword} ${token}` },
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

  async currentUser({ token }: { token: string }): Promise<GitHubUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = (async () => {
        const res = await fetch(`${this.apiRoot}/user`, {
          headers: {
            Authorization: `${this.tokenKeyword} ${token}`,
          },
        });
        const user = await res.json();
        return {
          ...user,
          name: user.name || 'Unknown',
        } as GitHubUser;
      })();
    }
    return this._currentUserPromise;
  }

  async userIsOriginMaintainer({
    username: usernameArg,
    token,
  }: {
    username?: string,
    token: string,
  }) {
    const username = usernameArg || (await this.currentUser({ token })).login;
    this._userIsOriginMaintainerPromises = this._userIsOriginMaintainerPromises || {};
    if (!this._userIsOriginMaintainerPromises[username]) {
      this._userIsOriginMaintainerPromises[username] = fetch(
        `${this.apiRoot}/repos/${this.originRepo}/collaborators/${username}/permission`,
        {
          headers: {
            Authorization: `${this.tokenKeyword} ${token}`,
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
          Authorization: `${this.tokenKeyword} ${token}`,
        },
      }).then(res => res.json());

      // https://developer.github.com/v3/repos/#get
      // The parent and source objects are present when the repository is a fork.
      // parent is the repository this repository was forked from, source is the ultimate source for the network.
      const forkExists = repo.fork === true
        && repo.parent
        && repo.parent.full_name.toLowerCase() === this.originRepo.toLowerCase();
      return forkExists;
    } catch {
      return false;
    }
  }

  async authenticateWithFork({
    userData,
    getPermissionToFork,
  }: {
    userData: CmsUser,
    getPermissionToFork: () => Promise<boolean> | boolean,
  }) {
    if (!this.openAuthoringEnabled) {
      throw new Error('Cannot authenticate with fork; Open Authoring is turned off.');
    }
    const token = userData.token as string;

    // Origin maintainers should be able to use the CMS normally. If alwaysFork
    // is enabled we always fork (and avoid the origin maintainer check)
    if (!this.alwaysForkEnabled && (await this.userIsOriginMaintainer({ token }))) {
      this.repo = this.originRepo;
      this.useOpenAuthoring = false;
      return Promise.resolve();
    }

    // If a fork exists merge it with upstream
    // otherwise create a new fork.
    const currentUser = await this.currentUser({ token });
    const repoName = this.originRepo.split('/')[1];
    this.repo = `${currentUser.login}/${repoName}`;
    this.useOpenAuthoring = true;

    if (await this.forkExists({ token })) {
      return fetch(`${this.apiRoot}/repos/${this.repo}/merge-upstream`, {
        method: 'POST',
        headers: {
          Authorization: `${this.tokenKeyword} ${token}`,
        },
        body: JSON.stringify({
          branch: this.branch,
        }),
      });
    } else {
      await getPermissionToFork();

      const fork = await fetch(`${this.apiRoot}/repos/${this.originRepo}/forks`, {
        method: 'POST',
        headers: {
          Authorization: `${this.tokenKeyword} ${token}`,
        },
      }).then(res => res.json());
      return this.pollUntilForkExists({ repo: fork.full_name, token });
    }
  }

  async authenticate(state: CmsCredentials) {
    this.token = state.token as string;
    // Query the default branch name when the `branch` property is missing
    // in the config file
    if (!this.isBranchConfigured) {
      const repoInfo = await fetch(`${this.apiRoot}/repos/${this.originRepo}`, {
        headers: { Authorization: `token ${this.token}` },
      })
        .then(res => res.json())
        .catch(() => null);
      if (repoInfo && repoInfo.default_branch) {
        this.branch = repoInfo.default_branch;
      }
    }
    if (this.useGraphql && !registeredGraphQLAPI) {
      throw new Error(
        'The GitHub backend has `use_graphql` enabled, but no GraphQL API is registered. '
          + "Import 'decap-cms/backends/github/graphql' and install the optional "
          + 'GraphQL peer dependencies to use it.',
      );
    }
    const apiCtor = this.useGraphql ? registeredGraphQLAPI! : API;
    this.api = new apiCtor({
      token: this.token,
      tokenKeyword: this.tokenKeyword,
      branch: this.branch,
      repo: this.repo,
      originRepo: this.originRepo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      useOpenAuthoring: this.useOpenAuthoring,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
      baseUrl: this.baseUrl,
      getUser: args => this.currentUser(args),
    });
    const user = await this.api!.user();
    const isCollab = await this.api!.hasWriteAccess().catch(error => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If the repo is private, make sure you're logged into a GitHub account with access.

        If your repo is under an organization, ensure the organization has granted access to Decap CMS.
      `;
      throw error;
    });

    // Unauthorized user
    if (!isCollab && !this.bypassWriteAccessCheckForAppTokens) {
      throw new Error('Your GitHub user account does not have access to this repo.');
    }

    // if (!this.isBranchConfigured) {
    //   const defaultBranchName = await this.api.getDefaultBranchName()
    //   if (defaultBranchName) {
    //     this.branch = defaultBranchName;
    //   }
    // }

    // A manager left from an earlier sign-in would keep polling with that
    // session's API and token.
    this.pollingManager?.destroy();
    this.unwatchFunctions.clear();
    this.pollingManager = new NotesPollingManager(this.api!, NOTES_POLLING_INTERVAL);

    // Authorized user
    return {
      ...user,
      token: state.token as string,
      ...(this.useOpenAuthoring === undefined ? {} : { useOpenAuthoring: this.useOpenAuthoring }),
    };
  }

  logout() {
    this.token = null;
    this.pollingManager?.destroy();
    this.pollingManager = undefined;
    this.unwatchFunctions.clear();
    if (this.api && this.api.reset && typeof this.api.reset === 'function') {
      return this.api.reset();
    }
  }

  getToken() {
    return Promise.resolve(this.token);
  }

  // Authorizes requests against hosts other than `this.apiRoot` (the LFS batch endpoint lives on
  // `github.com`, not `api.github.com`) with the same token the backend already holds, rather
  // than introducing a second auth mechanism.
  requestFunction = (req: ApiRequest) => {
    const authorizedRequest = unsentRequest.withHeaders(
      { Authorization: `${this.tokenKeyword} ${this.token}` },
      req,
    );
    return unsentRequest.performRequest(authorizedRequest);
  };

  /**
   * Build (once) the LFS client for this repo. `.gitattributes` decides whether LFS is in play
   * at all: no `filter=lfs diff=lfs merge=lfs` patterns means the client stays disabled and every
   * LFS code path below short-circuits.
   */
  getLargeMediaClient() {
    if (!this._largeMediaClientPromise) {
      this._largeMediaClientPromise = (async (): Promise<GitLfsClient> => {
        const patterns = await this.api!.readFile('.gitattributes')
          .then(attributes => getLargeMediaPatternsFromGitAttributesFile(attributes as string))
          .catch((err: FetchError) => {
            // A repo with no `.gitattributes` simply isn't using LFS.
            if (err.status !== 404) {
              console.error(err);
            }
            return [];
          });

        return new GitLfsClient(
          patterns.length > 0,
          this.largeMediaURL,
          patterns,
          this.requestFunction,
        );
      })();
    }
    return this._largeMediaClientPromise;
  }

  /**
   * GitHub's contents/blobs API doesn't resolve LFS pointer files server-side (unlike e.g.
   * GitLab's `lfs=true` raw-content param), so a file tracked by LFS round-trips as the raw
   * pointer text unless we detect and resolve it ourselves via the LFS batch API.
   *
   * Every failure path returns the original blob rather than throwing: a media file that can't
   * be resolved should degrade to a broken preview, not break loading the entry around it.
   */
  async resolvePointerFile(path: string, blob: Blob, client: GitLfsClient): Promise<Blob> {
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    if (!client.enabled || blob.size > MAX_POINTER_FILE_SIZE || !client.matchPath(fixedPath)) {
      return blob;
    }

    let text: string;
    try {
      text = await blob.text();
    } catch {
      return blob;
    }
    if (!text.startsWith(LFS_POINTER_VERSION_PREFIX)) {
      return blob;
    }

    const { sha, size } = parsePointerFile(text);
    if (!sha || !Number.isFinite(size)) {
      return blob;
    }

    try {
      // Destructured rather than passed whole: `parsePointerFile` spreads every
      // line of the pointer file into its result (including `version`), and the
      // batch request body spreads the pointer, so passing it as-is would put
      // stray keys on the wire.
      return await client.downloadResource({ sha, size });
    } catch (err) {
      console.error(`Failed resolving LFS pointer file for '${path}'`, err);
      return blob;
    }
  }

  /**
   * Wrap a `readFile`-shaped function so any LFS pointer file it returns is transparently
   * resolved to the real object bytes before reaching the media-loading helpers.
   */
  lfsAwareReadFile(readFile: ReadFile): ReadFile {
    return async (path, id, options) => {
      const result = await readFile(path, id, options);
      if (!(result instanceof Blob)) {
        return result;
      }
      const client = await this.getLargeMediaClient();
      return this.resolvePointerFile(path, result, client);
    };
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

    (files as CursorCompatibleEntries<BackendEntry>)[CURSOR_COMPATIBILITY_SYMBOL] = cursor!;
    return files;
  }

  async allEntriesByFolder(folder: string, extension: string, depth: number, pathRegex?: RegExp) {
    const repoURL = this.api!.originRepoURL;

    const listFiles = () =>
      this.api!.listFiles(folder, {
        repoURL,
        depth,
      }).then(files =>
        files.filter(
          file => (!pathRegex || pathRegex.test(file.path)) && filterByExtension(file, extension),
        )
      );

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

  entriesByFiles(files: BackendFileRef[]) {
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
        content: rawContent(data as string),
      }))
      // A read failure is reported as empty content, which `contentExists`
      // reads as "no entry here". Long-standing behavior the slug-uniqueness
      // check depends on.
      .catch(() => ({ file: { path, id: null }, content: rawContent('') }));
  }

  getMedia(mediaFolder = this.mediaFolder, folderSupport?: boolean) {
    return this.api!.listFiles(mediaFolder, undefined, folderSupport).then(files =>
      files.map(({ id, name, size, path, type }) => {
        // load media using getMediaDisplayURL to avoid token expiration with GitHub raw content urls
        // for private repositories
        return { id, name, size, displayURL: { id, path }, path, isDirectory: type === 'tree' };
      })
    );
  }

  async getMediaFile(path: string) {
    const readFile = this.lfsAwareReadFile(this.api!.readFile.bind(this.api!));
    const blob = await getMediaAsBlob(path, null, readFile);

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

  getMediaDisplayURL(displayURL: CmsDisplayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || createSemaphore(MAX_CONCURRENT_DOWNLOADS);
    const readFile = this.lfsAwareReadFile(this.api!.readFile.bind(this.api!));
    return getMediaDisplayURL(displayURL, readFile, this._mediaDisplayURLSem);
  }

  async persistEntry(entry: PersistPayload, options: CmsPersistOptions) {
    const client = await this.getLargeMediaClient();
    // persistEntry is a transactional operation
    return runWithLock(
      this.lock,
      async () =>
        this.api!.persistFiles(
          entry.dataFiles,
          client.enabled ? await getLargeMediaFilteredMediaFiles(client, entry.assets) : entry.assets,
          options,
        ),
      'Failed to acquire persist entry lock',
    );
  }

  async persistMedia(mediaFile: CmsAssetProxy, options: CmsPersistOptions) {
    const { fileObj, path } = mediaFile;
    const client = await this.getLargeMediaClient();
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    if (!client.enabled || !client.matchPath(fixedPath)) {
      return this._persistMedia(mediaFile, options);
    }

    // The pointer file is what gets committed; the display URL still has to point at the real
    // bytes the editor just picked, not at the pointer text.
    const displayURL = fileObj ? URL.createObjectURL(fileObj as File) : '';
    const pointerFile = await getPointerFileForMediaFileObj(client, fileObj as File, path);
    // Same merge `getLargeMediaFilteredMediaFiles` does for entry assets: keep the proxy and
    // override only the fields that now describe the pointer file rather than the real object.
    return {
      ...(await this._persistMedia({ ...mediaFile, ...pointerFile }, options)),
      displayURL,
    };
  }

  async _persistMedia(mediaFile: CmsAssetProxy, options: CmsPersistOptions) {
    try {
      await this.api!.persistFiles([], [mediaFile], options);
      const { sha, path, fileObj } = mediaFile as CmsAssetProxy & { sha: string };
      const displayURL = fileObj ? URL.createObjectURL(fileObj) : '';
      return {
        id: sha,
        name: fileObj!.name,
        size: fileObj!.size,
        displayURL,
        path: trimStart(path, '/'),
      };
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  deleteFiles(paths: string[], commitMessage: string) {
    return this.api!.deleteFiles(paths, commitMessage);
  }

  async traverseCursor(cursor: Cursor, action: string) {
    const meta = cursor.meta!;
    const files = cursor.data!['files'] as ApiFile[];

    let result: { cursor: Cursor, files: ApiFile[] };
    switch (action) {
      case 'first': {
        result = this.getCursorAndFiles(files, 1);
        break;
      }
      case 'last': {
        result = this.getCursorAndFiles(files, meta['pageCount'] as number);
        break;
      }
      case 'next': {
        result = this.getCursorAndFiles(files, (meta['page'] as number) + 1);
        break;
      }
      case 'prev': {
        result = this.getCursorAndFiles(files, (meta['page'] as number) - 1);
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

  async loadMediaFile(branch: string, file: CmsUnpublishedEntryMediaFile) {
    const readFile = this.lfsAwareReadFile(
      (path: string, id: string | null | undefined, { parseText }: { parseText: boolean }) =>
        this.api!.readFile(path, id, { branch, parseText }),
    );

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
      this.api!.listUnpublishedBranches().then(branches => branches.map(branch => contentKeyFromBranch(branch)));

    const ids = await unpublishedEntries(listEntriesKeys);
    return ids;
  }

  async unpublishedEntry({
    id,
    collection,
    slug,
  }: {
    id?: string | undefined,
    collection?: string | undefined,
    slug?: string | undefined,
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
    } catch (e: unknown) {
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
      async () => {
        await this.api!.deleteUnpublishedEntry(collection, slug);
        if (notesConfigured(this.config)) {
          await this.api!.closeEntryNotesIssue(collection, slug);
        }
      },
      'Failed to acquire delete entry lock',
    );
  }

  publishUnpublishedEntry(collection: string, slug: string) {
    // publishUnpublishedEntry is a transactional operation
    return runWithLock(
      this.lock,
      async () => {
        await this.api!.publishUnpublishedEntry(collection, slug);
        if (notesConfigured(this.config)) {
          await this.api!.closeIssueOnPublish(collection, slug);
        }
      },
      'Failed to acquire publish entry lock',
    );
  }

  // -- Editor notes (decaporg #7563 / #7994) ----------------------------------
  // Each entry's notes are comments on a GitHub issue of its own; see the
  // notes section of API.tsx.

  /**
   * Who the signed-in editor is, as a note records them: a display name, and a
   * stable id when the account that posts the comment is not the editor.
   */
  async noteAuthorIdentity(): Promise<{ author: string, authorId?: string | undefined }> {
    const currentUser = await this.currentUser({ token: this.token! });
    // No id on purpose: the editor posts as themselves and GitHub reports the
    // author's current login on every read, so ownership follows a rename.
    // Recording an id here would freeze it.
    return { author: currentUser.login || currentUser.name || '' };
  }

  /** Ownership is decided here because only the backend knows how its identities compare. */
  private async markOwnNotes(notes: Note[]): Promise<Note[]> {
    return markOwnNotes(notes, await this.noteAuthorIdentity());
  }

  private async entryNotes(collection: string, slug: string) {
    const notes = await this.api!.getEntryNotes(collection, slug);
    return this.markOwnNotes(notes.map(note => ({ ...note, entrySlug: slug })));
  }

  private async findNote(collection: string, slug: string, noteId: string) {
    const note = (await this.entryNotes(collection, slug)).find(n => n.id === noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    return note;
  }

  async getNotes(collection: string, slug: string): Promise<Note[]> {
    try {
      return await this.entryNotes(collection, slug);
    } catch (error: unknown) {
      console.error('Failed to get notes:', error);
      return [];
    }
  }

  async addNote(collection: string, slug: string, noteData: Omit<Note, 'id'>, entryTitle?: string): Promise<Note> {
    const currentUser = await this.currentUser({ token: this.token! });
    const identity = await this.noteAuthorIdentity();
    const note: Note = {
      ...noteData,
      id: `temp-${Date.now()}`,
      author: identity.author,
      authorId: identity.authorId,
      isOwn: true,
      // A recorded author means someone else posts for them, whose avatar
      // would mislabel the note.
      avatarUrl: identity.authorId ? undefined : currentUser.avatar_url,
      entrySlug: slug,
      timestamp: noteData.timestamp || new Date().toISOString(),
      resolved: noteData.resolved || false,
      issueUrl: undefined,
    };

    const { commentId, issueUrl } = await this.api!.addNoteToEntry(collection, slug, note, entryTitle);
    return { ...note, id: commentId, issueUrl };
  }

  /** A comment is replaced whole, so the note is read back to merge `updates` into. */
  async updateNote(collection: string, slug: string, noteId: string, updates: Partial<Note>): Promise<Note> {
    const existing = await this.findNote(collection, slug, noteId);
    const updated: Note = { ...existing, ...updates, id: noteId, entrySlug: slug };
    await this.api!.updateEntryNote(noteId, updated);
    return updated;
  }

  async deleteNote(collection: string, slug: string, noteId: string): Promise<void> {
    await this.findNote(collection, slug, noteId);
    await this.api!.deleteEntryNote(noteId);
  }

  async toggleNoteResolution(collection: string, slug: string, noteId: string): Promise<Note> {
    const note = await this.findNote(collection, slug, noteId);
    return this.updateNote(collection, slug, noteId, { resolved: !note.resolved });
  }

  /** Reopens the entry's notes thread, closed when it was published, once it is unpublished. */
  async reopenIssueForUnpublishedEntry(collection: string, slug: string) {
    if (notesConfigured(this.config)) {
      await this.api!.reopenIssueOnUnpublish(collection, slug);
    }
  }

  /**
   * Watches the entry's thread so other editors' notes appear. The entry may
   * have no thread yet (or search may not see a new one), so the lookup is
   * retried a few times before giving up quietly.
   */
  async startNotesPolling(collection: string, slug: string, callbacks: NotesWatchCallbacks): Promise<void> {
    if (!this.pollingManager) {
      console.warn('[DecapNotes Polling] Polling manager not initialized');
      return;
    }

    const issueKey = `${collection}/${slug}`;
    if (this.pollingManager.getStatus().currentWatch === issueKey) {
      return;
    }

    this.unwatchFunctions.get(issueKey)?.();
    this.unwatchFunctions.delete(issueKey);

    try {
      const unwatch = await this.pollingManager.watchIssueWithRetry(
        collection,
        slug,
        {
          ...callbacks,
          // Polled notes are rebuilt from the thread's comments without the
          // ownership flag getNotes adds; without this a poll would strip
          // Edit/Resolve/Delete off the editor's own notes.
          prepareNotes: notes => this.markOwnNotes(notes),
        },
        5,
        2000,
      );
      this.unwatchFunctions.set(issueKey, unwatch);
    } catch (error: unknown) {
      console.error('[DecapNotes Polling] Failed to start polling after retries:', error);
    }
  }

  async stopNotesPolling(collection: string, slug: string): Promise<void> {
    const issueKey = `${collection}/${slug}`;
    this.unwatchFunctions.get(issueKey)?.();
    this.unwatchFunctions.delete(issueKey);
    // Also cancels a lookup still retrying for this entry.
    this.pollingManager?.stopWatching(collection, slug);
  }

  async refreshNotesNow(collection: string, slug: string): Promise<void> {
    if (!this.pollingManager) {
      throw new Error('Polling manager not initialized');
    }
    await this.pollingManager.checkIssueNow(collection, slug);
  }
}
