import semaphore, { Semaphore } from 'semaphore';
import { flow, trimStart } from 'lodash';
import { stripIndent } from 'common-tags';
import {
  CURSOR_COMPATIBILITY_SYMBOL,
  filterByPropExtension,
  resolvePromiseProperties,
  then,
  unsentRequest,
  basename,
  getBlobSHA,
  getCollectionDepth,
  Entry,
  Map,
  ApiRequest,
  CursorType,
  AssetProxy,
  PersistOptions,
  DisplayURL,
  Implementation,
  ImplementationEntry,
  DisplayURLObject,
  EditorialWorkflowError,
  Collection,
} from 'netlify-cms-lib-util';
import NetlifyAuthenticator from 'netlify-cms-lib-auth';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

// Implementation wrapper class
export default class BitbucketBackend implements Implementation {
  config: Map;
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
  refreshToken?: string;
  refreshedTokenPromise?: Promise<string>;
  authenticator?: NetlifyAuthenticator;
  auth?: unknown;
  _mediaDisplayURLSem?: Semaphore;

  constructor(config: Map, options = {}) {
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
    this.apiRoot = config.getIn(['backend', 'api_root'], 'https://api.bitbucket.org/2.0');
    this.baseUrl = config.get('base_url');
    this.siteId = config.get('site_id');
    this.token = '';
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

  restoreUser(user: { token: string; refresh_token: string }) {
    return this.authenticate(user);
  }

  async authenticate(state: { token: string; refresh_token: string }) {
    this.token = state.token;
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
      then(async res => {
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

  entriesByFolder(collection: Collection, extension: string) {
    const listPromise = this.api!.listFiles(
      collection.get('folder') as string,
      getCollectionDepth(collection),
    );
    return resolvePromiseProperties<
      { files: Promise<{}[]>; cursor: Promise<CursorType> },
      { files: []; cursor: CursorType }
    >({
      files: listPromise
        .then(({ entries }) => entries)
        .then(filterByPropExtension(extension, 'path'))
        .then(this.fetchFiles),
      cursor: listPromise.then(({ cursor }) => cursor),
    }).then(({ files, cursor }) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      files[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
      return files;
    });
  }

  allEntriesByFolder(collection: Collection, extension: string) {
    return this.api!.listAllFiles(
      collection.get('folder') as string,
      getCollectionDepth(collection),
    )
      .then(filterByPropExtension(extension, 'path'))
      .then(this.fetchFiles);
  }

  entriesByFiles(collection: Collection) {
    const files = collection
      .get('files')!
      .map(collectionFile => ({
        path: collectionFile!.get('file'),
        label: collectionFile!.get('label'),
      }))
      .toArray();
    return this.fetchFiles(files);
  }

  fetchFiles = (files: { path: string; id?: string }[]) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [] as Promise<ImplementationEntry | { error: boolean }>[];
    files.forEach(file => {
      promises.push(
        new Promise(resolve =>
          sem.take(() =>
            this.api!.readFile(file.path, file.id)
              .then(data => {
                resolve({ file, data: data as string });
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
      loadedEntries.filter(loadedEntry => !((loadedEntry as unknown) as { error: boolean }).error),
    ) as Promise<ImplementationEntry[]>;
  };

  getEntry(path: string) {
    return this.api!.readFile(path).then(data => ({
      file: { path },
      data: data as string,
    }));
  }

  getMedia(mediaFolder = this.config.get<string>('media_folder')) {
    return this.api!.listAllFiles(mediaFolder).then(files =>
      files.map(({ id, name, path }) => ({ id, name, path, displayURL: { id, path } })),
    );
  }

  getMediaAsBlob(path: string, id: string | null) {
    return this.api!.readFile(path, id, { parseText: false });
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || semaphore(MAX_CONCURRENT_DOWNLOADS);
    const { id, path } = displayURL as DisplayURLObject;
    return new Promise<string>((resolve, reject) =>
      this._mediaDisplayURLSem!.take(() =>
        this.getMediaAsBlob(path, id)
          .then(blob => URL.createObjectURL(blob))
          .then(resolve, reject)
          .finally(() => this._mediaDisplayURLSem!.leave()),
      ),
    );
  }

  async getMediaFile(path: string) {
    const name = basename(path);
    const blob = await this.getMediaAsBlob(path, null);
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

  traverseCursor(cursor: CursorType, action: string) {
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

  async unpublishedEntry(collection: Collection, _slug: string) {
    if (collection) {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }
    return { data: '', file: { path: '' } };
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
