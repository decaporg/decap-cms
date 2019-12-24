import trimStart from 'lodash/trimStart';
import semaphore, { Semaphore } from 'semaphore';
import { trim } from 'lodash';
import { stripIndent } from 'common-tags';
import {
  CURSOR_COMPATIBILITY_SYMBOL,
  basename,
  getCollectionDepth,
  Map,
  Entry,
  AssetProxy,
  PersistOptions,
  CursorType,
  Implementation,
  DisplayURL,
} from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitLab implements Implementation {
  config: Map;
  api: API | null;
  options: {
    proxied: boolean;
    API: API | null;
    useWorkflow?: boolean;
  };
  repo: string;
  branch: string;
  apiRoot: string;
  token: string | null;

  _mediaDisplayURLSem?: Semaphore;

  constructor(config: Map, options = {}) {
    this.config = config;
    this.options = {
      proxied: false,
      API: null,
      ...options,
    };

    if (this.options.useWorkflow) {
      throw new Error('The GitLab backend does not support the Editorial Workflow.');
    }

    if (!this.options.proxied && config.getIn(['backend', 'repo']) == null) {
      throw new Error('The GitLab backend needs a "repo" in the backend configuration.');
    }

    this.api = this.options.API || null;

    this.repo = config.getIn(['backend', 'repo'], '');
    this.branch = config.getIn(['backend', 'branch'], 'master');
    this.apiRoot = config.getIn(['backend', 'api_root'], 'https://gitlab.com/api/v4');
    this.token = '';
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user: { token: string }) {
    return this.authenticate(user);
  }

  async authenticate(state: { token: string }) {
    this.token = state.token;
    this.api = new API({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      apiRoot: this.apiRoot,
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
    return { ...user, login: user.username, token: state.token };
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

  entriesByFolder(collection: Map, extension: string) {
    const depth = getCollectionDepth(collection);
    const folder = collection.get<string>('folder');
    return this.api!.listFiles(folder, depth > 1).then(({ files, cursor }) =>
      this.fetchFiles(files.filter(file => this.filterFile(folder, file, extension, depth))).then(
        fetchedFiles => {
          const returnedFiles = fetchedFiles;
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          returnedFiles[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
          return returnedFiles;
        },
      ),
    );
  }

  allEntriesByFolder(collection: Map, extension: string) {
    const depth = getCollectionDepth(collection);
    const folder = collection.get<string>('folder');
    return this.api!.listAllFiles(folder, depth > 1).then(files =>
      this.fetchFiles(files.filter(file => this.filterFile(folder, file, extension, depth))),
    );
  }

  entriesByFiles(collection: Map) {
    const files = collection.get<Map[]>('files').map(collectionFile => ({
      path: collectionFile.get<string>('file'),
      label: collectionFile.get<string>('label'),
    }));
    return this.fetchFiles(files).then(fetchedFiles => {
      const returnedFiles = fetchedFiles;
      return returnedFiles;
    });
  }

  fetchFiles = (files: { path: string; id?: string }[]) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [] as Promise<
      { file: { path: string; id?: string }; data: string | Blob; error?: Error } | { error: Error }
    >[];
    files.forEach(file => {
      promises.push(
        new Promise(resolve =>
          sem.take(() =>
            this.api!.readFile(file.path, file.id)
              .then(data => {
                resolve({ file, data });
                sem.leave();
              })
              .catch((error = true) => {
                sem.leave();
                console.error(`failed to load file from GitLab: ${file.path}`);
                resolve({ error });
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
  getEntry(collection: Map, slug: string, path: string) {
    return this.api!.readFile(path).then(data => ({
      file: { path },
      data,
    }));
  }

  getMedia(mediaFolder = this.config.get<string>('media_folder')) {
    return this.api!.listAllFiles(mediaFolder).then(files =>
      files.map(({ id, name, path }) => {
        return { id, name, path, displayURL: { id, name, path } };
      }),
    );
  }

  async getMediaAsBlob(path: string, id: string | null) {
    let blob = (await this.api!.readFile(path, id, { parseText: false })) as Blob;
    // svgs are returned with mimetype "text/plain" by gitlab
    if (blob.type === 'text/plain' && path.match(/\.svg$/i)) {
      blob = new window.Blob([blob], { type: 'image/svg+xml' });
    }

    return blob;
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    this._mediaDisplayURLSem = this._mediaDisplayURLSem || semaphore(MAX_CONCURRENT_DOWNLOADS);
    const { id, path } = displayURL;
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

    return {
      displayURL: url,
      path,
      name,
      size: fileObj.size,
      file: fileObj,
      url,
    };
  }

  async persistEntry(entry: Entry, mediaFiles: AssetProxy[], options: PersistOptions) {
    await this.api!.persistFiles([entry], options);
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    const [{ sha }] = await this.api!.persistFiles([mediaFile], options);
    const { path, fileObj } = mediaFile;
    const url = URL.createObjectURL(fileObj);

    return {
      displayURL: url,
      path: trimStart(path, '/'),
      name: fileObj!.name,
      size: fileObj!.size,
      file: fileObj,
      url,
      id: sha,
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
            this.api!.readFile(file.path, file.id).then(data => ({ file, data })),
          ),
        ),
        cursor: newCursor,
      }),
    );
  }
}
