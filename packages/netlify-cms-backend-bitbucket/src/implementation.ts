import semaphore, { Semaphore } from 'semaphore';
import { flow, trimStart } from 'lodash';
import { stripIndent } from 'common-tags';
import {
  CURSOR_COMPATIBILITY_SYMBOL,
  filterByPropExtension,
  then,
  unsentRequest,
  basename,
  getBlobSHA,
  Entry,
  ApiRequest,
  Cursor,
  AssetProxy,
  PersistOptions,
  DisplayURL,
  Implementation,
  EditorialWorkflowError,
  entriesByFolder,
  entriesByFiles,
  User,
  Credentials,
  getMediaDisplayURL,
  getMediaAsBlob,
  Config,
  ImplementationFile,
} from 'netlify-cms-lib-util';
import NetlifyAuthenticator from 'netlify-cms-lib-auth';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

// Implementation wrapper class
export default class BitbucketBackend implements Implementation {
  api: API | null;
  updateUserCredentials: (args: { token: string; refresh_token: string }) => Promise<null>;
  options: {
    proxied: boolean;
    API: API | null;
    updateUserCredentials: (args: { token: string; refresh_token: string }) => Promise<null>;
    useWorkflow?: boolean;
  };
  repo: string;
  branch: string;
  apiRoot: string;
  baseUrl: string;
  siteId: string;
  token: string | null;
  mediaFolder: string;
  refreshToken?: string;
  refreshedTokenPromise?: Promise<string>;
  authenticator?: NetlifyAuthenticator;
  auth?: unknown;
  _mediaDisplayURLSem?: Semaphore;

  constructor(config: Config, options = {}) {
    this.options = {
      proxied: false,
      API: null,
      updateUserCredentials: async () => null,
      ...options,
    };

    if (
      !this.options.proxied &&
      (config.backend.repo === null || config.backend.repo === undefined)
    ) {
      throw new Error('The BitBucket backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.updateUserCredentials = this.options.updateUserCredentials;

    this.repo = config.backend.repo || '';
    this.branch = config.backend.branch || 'master';
    this.apiRoot = config.backend.api_root || 'https://api.bitbucket.org/2.0';
    this.baseUrl = config.base_url || '';
    this.siteId = config.site_id || '';
    this.token = '';
    this.mediaFolder = config.media_folder;
  }

  authComponent() {
    return AuthenticationPage;
  }

  setUser(user: { token: string }) {
    this.token = user.token;
    this.api = new API({
      requestFunction: this.apiRequestFunction,
      branch: this.branch,
      repo: this.repo,
    });
  }

  restoreUser(user: User) {
    return this.authenticate(user);
  }

  async authenticate(state: Credentials) {
    this.token = state.token as string;
    this.refreshToken = state.refresh_token;
    this.api = new API({
      requestFunction: this.apiRequestFunction,
      branch: this.branch,
      repo: this.repo,
      apiRoot: this.apiRoot,
    });

    const isCollab = await this.api.hasWriteAccess().catch(error => {
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

    const user = await this.api.user();

    // Authorized user
    return {
      ...user,
      name: user.display_name,
      login: user.username,
      token: state.token,
      // eslint-disable-next-line @typescript-eslint/camelcase
      refresh_token: state.refresh_token,
    };
  }

  getRefreshedAccessToken() {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }

    // instantiating a new Authenticator on each refresh isn't ideal,
    if (!this.auth) {
      const cfg = {
        // eslint-disable-next-line @typescript-eslint/camelcase
        base_url: this.baseUrl,
        // eslint-disable-next-line @typescript-eslint/camelcase
        site_id: this.siteId,
      };
      this.authenticator = new NetlifyAuthenticator(cfg);
    }

    this.refreshedTokenPromise = this.authenticator! // eslint-disable-next-line @typescript-eslint/camelcase
      .refresh({ provider: 'bitbucket', refresh_token: this.refreshToken as string })
      // eslint-disable-next-line @typescript-eslint/camelcase
      .then(({ token, refresh_token }) => {
        this.token = token;
        // eslint-disable-next-line @typescript-eslint/camelcase
        this.refreshToken = refresh_token;
        this.refreshedTokenPromise = undefined;
        // eslint-disable-next-line @typescript-eslint/camelcase
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

  apiRequestFunction = async (req: ApiRequest) => {
    const token = (this.refreshedTokenPromise
      ? await this.refreshedTokenPromise
      : this.token) as string;

    return flow([
      unsentRequest.withHeaders({ Authorization: `Bearer ${token}` }) as (
        req: ApiRequest,
      ) => ApiRequest,
      unsentRequest.performRequest,
      then(async (res: Response) => {
        if (res.status === 401) {
          const json = await res.json().catch(() => null);
          if (json && json.type === 'error' && /^access token expired/i.test(json.error.message)) {
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
        return res;
      }),
    ])(req);
  };

  async entriesByFolder(folder: string, extension: string, depth: number) {
    let cursor: Cursor;

    const listFiles = () =>
      this.api!.listFiles(folder, depth).then(({ entries, cursor: c }) => {
        cursor = c;
        return filterByPropExtension(extension, 'path')(entries);
      });

    const files = await entriesByFolder(listFiles, this.api!.readFile.bind(this.api!), 'BitBucket');

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    files[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return files;
  }

  async allEntriesByFolder(folder: string, extension: string, depth: number) {
    const listFiles = () =>
      this.api!.listAllFiles(folder, depth).then(filterByPropExtension(extension, 'path'));

    const files = await entriesByFolder(listFiles, this.api!.readFile.bind(this.api!), 'BitBucket');
    return files;
  }

  async entriesByFiles(files: ImplementationFile[]) {
    return entriesByFiles(files, this.api!.readFile.bind(this.api!), 'BitBucket');
  }

  getEntry(path: string) {
    return this.api!.readFile(path).then(data => ({
      file: { path, id: null },
      data: data as string,
    }));
  }

  getMedia(mediaFolder = this.mediaFolder) {
    return this.api!.listAllFiles(mediaFolder).then(files =>
      files.map(({ id, name, path }) => ({ id, name, path, displayURL: { id, path } })),
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
    const id = await getBlobSHA(fileObj);

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
    await this.api!.persistFiles([entry, ...mediaFiles], options);
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    const fileObj = mediaFile.fileObj as File;

    const [id] = await Promise.all([
      getBlobSHA(fileObj),
      this.api!.persistFiles([mediaFile], options),
    ]);

    const url = URL.createObjectURL(fileObj);

    return {
      displayURL: url,
      path: trimStart(mediaFile.path, '/k'),
      name: fileObj!.name,
      size: fileObj!.size,
      id,
      file: fileObj,
      url,
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

  async unpublishedEntries() {
    return [];
  }

  async unpublishedEntry(collection: string, _slug: string) {
    if (collection) {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }
    return { data: '', file: { path: '', id: null } };
  }

  async updateUnpublishedEntryStatus(_collection: string, _slug: string, _newStatus: string) {
    return;
  }

  async publishUnpublishedEntry(_collection: string, _slug: string) {
    return;
  }

  async deleteUnpublishedEntry(_collection: string, _slug: string) {
    return;
  }

  async getDeployPreview(_collection: string, _slug: string) {
    return null;
  }
}
