import { attempt, isError, take, unset, isEmpty } from 'lodash';
import uuid from 'uuid/v4';
import {
  EditorialWorkflowError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  basename,
  Implementation,
  Entry,
  ImplementationEntry,
  AssetProxy,
  PersistOptions,
  User,
  Config,
  ImplementationFile,
} from 'netlify-cms-lib-util';
import { extname } from 'path';
import AuthenticationPage from './AuthenticationPage';

type RepoFile = { path: string; content: string | AssetProxy };
type RepoTree = { [key: string]: RepoFile | RepoTree };

type UnpublishedRepoEntry = {
  slug: string;
  collection: string;
  status: string;
  diffs: { id: string; path: string; newFile: boolean; status: string }[];
  timestamp: string;
  tree: RepoTree;
};

declare global {
  interface Window {
    repoFiles: RepoTree;
    repoFilesUnpublished: { [key: string]: UnpublishedRepoEntry };
  }
}

window.repoFiles = window.repoFiles || {};
window.repoFilesUnpublished = window.repoFilesUnpublished || [];

function getFile(path: string, tree: RepoTree) {
  const segments = path.split('/');
  let obj: RepoTree = tree;
  while (obj && segments.length) {
    obj = obj[segments.shift() as string] as RepoTree;
  }
  return ((obj as unknown) as RepoFile) || {};
}

function writeFile(path: string, content: string | AssetProxy, tree: RepoTree) {
  const segments = path.split('/');
  let obj = tree;
  while (segments.length > 1) {
    const segment = segments.shift() as string;
    obj[segment] = obj[segment] || {};
    obj = obj[segment] as RepoTree;
  }
  (obj[segments.shift() as string] as RepoFile) = { path, content };
}

function deleteFile(path: string, tree: RepoTree) {
  unset(tree, path.split('/'));
}

const pageSize = 10;

const getCursor = (
  folder: string,
  extension: string,
  entries: ImplementationEntry[],
  index: number,
  depth: number,
) => {
  const count = entries.length;
  const pageCount = Math.floor(count / pageSize);
  return Cursor.create({
    actions: [
      ...(index < pageCount ? ['next', 'last'] : []),
      ...(index > 0 ? ['prev', 'first'] : []),
    ],
    meta: { index, count, pageSize, pageCount },
    data: { folder, extension, index, pageCount, depth },
  });
};

export const getFolderFiles = (
  tree: RepoTree,
  folder: string,
  extension: string,
  depth: number,
  files = [] as RepoFile[],
  path = folder,
) => {
  if (depth <= 0) {
    return files;
  }

  Object.keys(tree[folder] || {}).forEach(key => {
    if (extname(key)) {
      const file = (tree[folder] as RepoTree)[key] as RepoFile;
      if (!extension || file.path.endsWith(`.${extension}`)) {
        files.unshift({ content: file.content, path: file.path });
      }
    } else {
      const subTree = tree[folder] as RepoTree;
      return getFolderFiles(subTree, key, extension, depth - 1, files, `${path}/${key}`);
    }
  });

  return files;
};

export default class TestBackend implements Implementation {
  mediaFolder: string;
  options: { initialWorkflowStatus?: string };

  constructor(config: Config, options = {}) {
    this.options = options;
    this.mediaFolder = config.media_folder;
  }

  isGitBackend() {
    return false;
  }

  status() {
    return Promise.resolve({ auth: { status: true }, api: { status: true, statusPage: '' } });
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser() {
    return this.authenticate();
  }

  authenticate() {
    return (Promise.resolve() as unknown) as Promise<User>;
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  traverseCursor(cursor: Cursor, action: string) {
    const { folder, extension, index, pageCount, depth } = cursor.data!.toObject() as {
      folder: string;
      extension: string;
      index: number;
      pageCount: number;
      depth: number;
    };
    const newIndex = (() => {
      if (action === 'next') {
        return (index as number) + 1;
      }
      if (action === 'prev') {
        return (index as number) - 1;
      }
      if (action === 'first') {
        return 0;
      }
      if (action === 'last') {
        return pageCount;
      }
      return 0;
    })();
    // TODO: stop assuming cursors are for collections
    const allFiles = getFolderFiles(window.repoFiles, folder, extension, depth);
    const allEntries = allFiles.map(f => ({
      data: f.content as string,
      file: { path: f.path, id: f.path },
    }));
    const entries = allEntries.slice(newIndex * pageSize, newIndex * pageSize + pageSize);
    const newCursor = getCursor(folder, extension, allEntries, newIndex, depth);
    return Promise.resolve({ entries, cursor: newCursor });
  }

  entriesByFolder(folder: string, extension: string, depth: number) {
    const files = folder ? getFolderFiles(window.repoFiles, folder, extension, depth) : [];
    const entries = files.map(f => ({
      data: f.content as string,
      file: { path: f.path, id: f.path },
    }));
    const cursor = getCursor(folder, extension, entries, 0, depth);
    const ret = take(entries, pageSize);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    ret[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return Promise.resolve(ret);
  }

  entriesByFiles(files: ImplementationFile[]) {
    return Promise.all(
      files.map(file => ({
        file,
        data: getFile(file.path, window.repoFiles).content as string,
      })),
    );
  }

  getEntry(path: string) {
    return Promise.resolve({
      file: { path, id: null },
      data: getFile(path, window.repoFiles).content as string,
    });
  }

  unpublishedEntries() {
    return Promise.resolve(Object.keys(window.repoFilesUnpublished));
  }

  unpublishedEntry({ id, collection, slug }: { id?: string; collection?: string; slug?: string }) {
    if (id) {
      const parts = id.split('/');
      collection = parts[0];
      slug = parts[1];
    }
    const entry = window.repoFilesUnpublished[`${collection}/${slug}`];
    if (!entry) {
      return Promise.reject(
        new EditorialWorkflowError('content is not under editorial workflow', true),
      );
    }

    return Promise.resolve(entry);
  }

  async unpublishedEntryDataFile(collection: string, slug: string, path: string) {
    const entry = window.repoFilesUnpublished[`${collection}/${slug}`];
    const file = getFile(path, entry.tree);
    return file.content as string;
  }

  async unpublishedEntryMediaFile(collection: string, slug: string, path: string) {
    const entry = window.repoFilesUnpublished[`${collection}/${slug}`];
    const file = getFile(path, entry.tree);
    return this.normalizeAsset(file.content as AssetProxy);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    delete window.repoFilesUnpublished[`${collection}/${slug}`];
    return Promise.resolve();
  }

  async addOrUpdateUnpublishedEntry(
    key: string,
    path: string,
    content: string,
    assetProxies: AssetProxy[],
    slug: string,
    collection: string,
    status: string,
  ) {
    const tree: RepoTree = {};
    writeFile(path, content, tree);
    const diffs = [];
    diffs.push({
      id: path,
      path,
      newFile: !isEmpty(getFile(path, window.repoFiles)),
      status: 'added',
    });
    assetProxies.forEach(a => {
      writeFile(a.path, a, tree);
      const asset = this.normalizeAsset(a);
      diffs.push({
        id: asset.id,
        path: asset.path,
        newFile: true,
        status: 'added',
      });
    });
    window.repoFilesUnpublished[key] = {
      slug,
      collection,
      status,
      diffs,
      timestamp: new Date().toISOString(),
      tree,
    };
  }

  async persistEntry(
    { path, raw, slug, newPath }: Entry,
    assetProxies: AssetProxy[],
    options: PersistOptions,
  ) {
    if (options.useWorkflow) {
      const key = `${options.collectionName}/${slug}`;
      const currentEntry = window.repoFilesUnpublished[key];
      if (currentEntry) {
        this.addOrUpdateUnpublishedEntry(
          key,
          newPath || path,
          raw,
          assetProxies,
          slug,
          options.collectionName as string,
          currentEntry.status,
        );
      } else {
        this.addOrUpdateUnpublishedEntry(
          key,
          newPath || path,
          raw,
          assetProxies,
          slug,
          options.collectionName as string,
          (options.status || this.options.initialWorkflowStatus) as string,
        );
      }
      return Promise.resolve();
    }

    writeFile(path, raw, window.repoFiles);
    assetProxies.forEach(a => {
      writeFile(a.path, raw, window.repoFiles);
    });
    return Promise.resolve();
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    window.repoFilesUnpublished[`${collection}/${slug}`].status = newStatus;
    return Promise.resolve();
  }

  publishUnpublishedEntry(collection: string, slug: string) {
    const key = `${collection}/${slug}`;
    const unpubEntry = window.repoFilesUnpublished[key];

    delete window.repoFilesUnpublished[key];

    const files = [] as RepoFile[];
    Object.keys(unpubEntry.tree).forEach(folder => {
      files.push(...getFolderFiles(unpubEntry.tree, folder, '', 100));
    });

    files.forEach(f => {
      writeFile(f.path, f.content, window.repoFiles);
    });

    return Promise.resolve();
  }

  getMedia(mediaFolder = this.mediaFolder) {
    const files = getFolderFiles(window.repoFiles, mediaFolder, '', 100);
    const assets = files.map(f => this.normalizeAsset(f.content as AssetProxy));
    return Promise.resolve(assets);
  }

  async getMediaFile(path: string) {
    const asset = getFile(path, window.repoFiles).content as AssetProxy;

    const url = asset.toString();
    const name = basename(path);
    const blob = await fetch(url).then(res => res.blob());
    const fileObj = new File([blob], name);

    return {
      id: url,
      displayURL: url,
      path,
      name,
      size: fileObj.size,
      file: fileObj,
      url,
    };
  }

  normalizeAsset(assetProxy: AssetProxy) {
    const fileObj = assetProxy.fileObj as File;
    const { name, size } = fileObj;
    const objectUrl = attempt(window.URL.createObjectURL, fileObj);
    const url = isError(objectUrl) ? '' : objectUrl;
    const normalizedAsset = {
      id: uuid(),
      name,
      size,
      path: assetProxy.path,
      url,
      displayURL: url,
      fileObj,
    };

    return normalizedAsset;
  }

  persistMedia(assetProxy: AssetProxy) {
    const normalizedAsset = this.normalizeAsset(assetProxy);

    writeFile(assetProxy.path, assetProxy, window.repoFiles);

    return Promise.resolve(normalizedAsset);
  }

  deleteFile(path: string) {
    deleteFile(path, window.repoFiles);

    return Promise.resolve();
  }

  async getDeployPreview() {
    return null;
  }
}
