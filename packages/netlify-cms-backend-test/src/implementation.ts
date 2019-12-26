import { attempt, isError, take, unset } from 'lodash';
import uuid from 'uuid/v4';
import {
  EditorialWorkflowError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  basename,
  getCollectionDepth,
  Implementation,
  Map,
  Collection,
  CursorType,
  Entry,
  ImplementationEntry,
  AssetProxy,
  PersistOptions,
  ImplementationMediaFile,
} from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';

type RepoFile = { file?: { path: string }; content: string };
type RepoTree = { [key: string]: RepoFile | RepoTree };

declare global {
  interface Window {
    repoFiles: RepoTree;
    repoFilesUnpublished: ImplementationEntry[];
  }
}

window.repoFiles = window.repoFiles || {};
window.repoFilesUnpublished = window.repoFilesUnpublished || [];

function getFile(path: string) {
  const segments = path.split('/');
  let obj: RepoTree = window.repoFiles;
  while (obj && segments.length) {
    obj = obj[segments.shift() as string] as RepoTree;
  }
  return ((obj as unknown) as RepoFile) || {};
}

const pageSize = 10;

const getCursor = (
  collection: Collection,
  extension: string,
  entries: ImplementationEntry[],
  index: number,
) => {
  const count = entries.length;
  const pageCount = Math.floor(count / pageSize);
  return Cursor.create({
    actions: [
      ...(index < pageCount ? ['next', 'last'] : []),
      ...(index > 0 ? ['prev', 'first'] : []),
    ],
    meta: { index, count, pageSize, pageCount },
    data: { collection, extension, index, pageCount },
  });
};

export const getFolderEntries = (
  tree: RepoTree,
  folder: string,
  extension: string,
  depth: number,
  files = [] as ImplementationEntry[],
  path = folder,
) => {
  if (depth <= 0) {
    return files;
  }

  Object.keys(tree[folder] || {}).forEach(key => {
    if (key.endsWith(`.${extension}`)) {
      const file = (tree[folder] as RepoTree)[key] as RepoFile;
      files.unshift({
        file: { path: `${path}/${key}` },
        data: file.content,
      });
    } else {
      const subTree = tree[folder] as RepoTree;
      return getFolderEntries(subTree, key, extension, depth - 1, files, `${path}/${key}`);
    }
  });

  return files;
};

export default class TestBackend implements Implementation {
  config: Map;
  assets: ImplementationMediaFile[];
  options: { initialWorkflowStatus?: string };

  constructor(config: Map, options = {}) {
    this.config = config;
    this.assets = [];
    this.options = options;
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser() {
    return this.authenticate();
  }

  authenticate() {
    return Promise.resolve();
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  traverseCursor(cursor: CursorType, action: string) {
    const { collection, extension, index, pageCount } = cursor.data.toObject();
    const newIndex = (() => {
      if (action === 'next') {
        return index + 1;
      }
      if (action === 'prev') {
        return index - 1;
      }
      if (action === 'first') {
        return 0;
      }
      if (action === 'last') {
        return pageCount;
      }
    })();
    // TODO: stop assuming cursors are for collections
    const depth = getCollectionDepth(collection);
    const allEntries = getFolderEntries(
      window.repoFiles,
      collection.get('folder'),
      extension,
      depth,
    );
    const entries = allEntries.slice(newIndex * pageSize, newIndex * pageSize + pageSize);
    const newCursor = getCursor(collection, extension, allEntries, newIndex);
    return Promise.resolve({ entries, cursor: newCursor });
  }

  entriesByFolder(collection: Collection, extension: string) {
    const folder = collection.get('folder');
    const depth = getCollectionDepth(collection);
    const entries = folder ? getFolderEntries(window.repoFiles, folder, extension, depth) : [];
    const cursor = getCursor(collection, extension, entries, 0);
    const ret = take(entries, pageSize);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    ret[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return Promise.resolve(ret);
  }

  entriesByFiles(collection: Collection) {
    const files = collection
      .get('files')!
      .map(collectionFile => ({
        path: collectionFile!.get('file'),
        label: collectionFile!.get('label'),
      }))
      .toArray();

    return Promise.all(
      files.map(file => ({
        file,
        data: getFile(file.path).content,
      })),
    );
  }

  getEntry(path: string) {
    return Promise.resolve({
      file: { path },
      data: getFile(path).content,
    });
  }

  unpublishedEntries() {
    return Promise.resolve(window.repoFilesUnpublished);
  }

  getMediaFiles(entry: ImplementationEntry) {
    const mediaFiles = entry.mediaFiles!.map(file => ({
      ...file,
      ...this.normalizeAsset(file),
      file: file.file as File,
    }));
    return mediaFiles;
  }

  unpublishedEntry(collection: Collection, slug: string) {
    const entry = window.repoFilesUnpublished.find(
      e => e.metaData!.collection === collection.get('name') && e.slug === slug,
    );
    if (!entry) {
      return Promise.reject(
        new EditorialWorkflowError('content is not under editorial workflow', true),
      );
    }
    entry.mediaFiles = this.getMediaFiles(entry);

    return Promise.resolve(entry);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    const unpubStore = window.repoFilesUnpublished;
    const existingEntryIndex = unpubStore.findIndex(
      e => e.metaData!.collection === collection && e.slug === slug,
    );
    unpubStore.splice(existingEntryIndex, 1);
    return Promise.resolve();
  }

  async persistEntry(
    { path, raw, slug }: Entry,
    assetProxies: AssetProxy[],
    options: PersistOptions,
  ) {
    if (options.useWorkflow) {
      const unpubStore = window.repoFilesUnpublished;

      const existingEntryIndex = unpubStore.findIndex(e => e.file.path === path);
      if (existingEntryIndex >= 0) {
        const unpubEntry = {
          ...unpubStore[existingEntryIndex],
          data: raw,
          title: options.parsedData && options.parsedData.title,
          description: options.parsedData && options.parsedData.description,
          mediaFiles: assetProxies.map(this.normalizeAsset),
        };

        unpubStore.splice(existingEntryIndex, 1, unpubEntry);
      } else {
        const unpubEntry = {
          data: raw,
          file: {
            path,
          },
          metaData: {
            collection: options.collectionName as string,
            status: (options.status || this.options.initialWorkflowStatus) as string,
            title: options.parsedData && options.parsedData.title,
            description: options.parsedData && options.parsedData.description,
          },
          slug,
          mediaFiles: assetProxies.map(this.normalizeAsset),
        };
        unpubStore.push(unpubEntry);
      }
      return Promise.resolve();
    }

    const newEntry = options.newEntry || false;

    const segments = path.split('/');
    const entry = newEntry ? { content: raw } : { ...getFile(path), content: raw };

    let obj = window.repoFiles;
    while (segments.length > 1) {
      const segment = segments.shift() as string;
      obj[segment] = obj[segment] || {};
      obj = obj[segment] as RepoTree;
    }
    (obj[segments.shift() as string] as RepoFile) = entry;

    await Promise.all(assetProxies.map(file => this.persistMedia(file)));
    return Promise.resolve();
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    const unpubStore = window.repoFilesUnpublished;
    const entryIndex = unpubStore.findIndex(
      e => e.metaData!.collection === collection && e.slug === slug,
    );
    unpubStore[entryIndex]!.metaData!.status = newStatus;
    return Promise.resolve();
  }

  async publishUnpublishedEntry(collection: string, slug: string) {
    const unpubStore = window.repoFilesUnpublished;
    const unpubEntryIndex = unpubStore.findIndex(
      e => e.metaData!.collection === collection && e.slug === slug,
    );
    const unpubEntry = unpubStore[unpubEntryIndex];
    const entry = {
      raw: unpubEntry.data,
      slug: unpubEntry.slug as string,
      path: unpubEntry.file.path,
    };
    unpubStore.splice(unpubEntryIndex, 1);

    await this.persistEntry(entry, unpubEntry.mediaFiles!, { commitMessage: '' });
  }

  getMedia() {
    return Promise.resolve(this.assets);
  }

  async getMediaFile(path: string) {
    const asset = this.assets.find(asset => asset.path === path) as ImplementationMediaFile;

    const url = asset.url as string;
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
    const normalizedAsset = { id: uuid(), name, size, path: assetProxy.path, url, displayURL: url };

    return normalizedAsset;
  }

  persistMedia(assetProxy: AssetProxy) {
    const normalizedAsset = this.normalizeAsset(assetProxy);

    this.assets.push(normalizedAsset);

    return Promise.resolve(normalizedAsset);
  }

  deleteFile(path: string) {
    const assetIndex = this.assets.findIndex(asset => asset.path === path);
    if (assetIndex > -1) {
      this.assets.splice(assetIndex, 1);
    } else {
      unset(window.repoFiles, path.split('/'));
    }

    return Promise.resolve();
  }

  async getDeployPreview() {
    return null;
  }
}
