import { attempt, isError, take, unset } from 'lodash';
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
  ImplementationMediaFile,
  User,
  Config,
  ImplementationFile,
  isCombineKey,
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

const getIndexesByKey = (files, key) => {
  return files.reduce((a, e, i) => (e.combineKey === key ? a.concat(i) : a), []).reverse();
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
        file: { path: `${path}/${key}`, id: null },
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
  assets: ImplementationMediaFile[];
  options: { initialWorkflowStatus?: string };

  constructor(_config: Config, options = {}) {
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
    const allEntries = getFolderEntries(window.repoFiles, folder, extension, depth);
    const entries = allEntries.slice(newIndex * pageSize, newIndex * pageSize + pageSize);
    const newCursor = getCursor(folder, extension, allEntries, newIndex, depth);
    return Promise.resolve({ entries, cursor: newCursor });
  }

  entriesByFolder(folder: string, extension: string, depth: number) {
    const entries = folder ? getFolderEntries(window.repoFiles, folder, extension, depth) : [];
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
        data: getFile(file.path).content,
      })),
    );
  }

  getEntry(path: string) {
    return Promise.resolve({
      file: { path, id: null },
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

  unpublishedEntry(collection: string, slug: string) {
    const entry = window.repoFilesUnpublished.find(
      e => e.metaData!.collection === collection && e.slug === slug,
    );
    if (!entry) {
      return Promise.reject(
        new EditorialWorkflowError('content is not under editorial workflow', true),
      );
    }
    entry.mediaFiles = this.getMediaFiles(entry);

    return Promise.resolve(entry);
  }

  unpublishedCombineEntry(combineKey: string, path: string) {
    const entry = window.repoFilesUnpublished.find(
      e => e.combineKey === combineKey && e.file.path === path,
    );

    entry.mediaFiles = this.getMediaFiles(entry);

    return Promise.resolve(entry);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    const unpubStore = window.repoFilesUnpublished;
    let entryIndexes = [
      unpubStore.findIndex(e => e.metaData!.collection === collection && e.slug === slug),
    ];
    isCombineKey(collection, slug) &&
      (entryIndexes = getIndexesByKey(unpubStore, `${collection}/${slug}`));

    entryIndexes.forEach(i => unpubStore.splice(i, 1));
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
            id: null,
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

  combineColletionEntry(combineArgs, entries) {
    const unpubStore = window.repoFilesUnpublished;
    entries.map(entry => {
      const existingEntryIndex = unpubStore.findIndex(
        e => e.slug === entry.slug && e.metaData.collection == entry.collection,
      );
      const unpubEntry = {
        ...unpubStore[existingEntryIndex],
        combineKey: `${combineArgs.collection}/${combineArgs.slug}`,
      };

      unpubStore.splice(existingEntryIndex, 1, unpubEntry);
    });

    return Promise.resolve();
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    const unpubStore = window.repoFilesUnpublished;
    let entryIndexes = [
      unpubStore.findIndex(e => e.metaData!.collection === collection && e.slug === slug),
    ];
    isCombineKey(collection, slug) &&
      (entryIndexes = getIndexesByKey(unpubStore, `${collection}/${slug}`));

    entryIndexes.forEach(i => (unpubStore[i]!.metaData!.status = newStatus));
    return Promise.resolve();
  }

  async publishUnpublishedEntry(collection: string, slug: string) {
    const unpubStore = window.repoFilesUnpublished;
    let entryIndexes = [
      unpubStore.findIndex(e => e.metaData!.collection === collection && e.slug === slug),
    ];
    isCombineKey(collection, slug) &&
      (entryIndexes = getIndexesByKey(unpubStore, `${collection}/${slug}`));
    const unpubEntries = entryIndexes.map(i => {
      const entry = unpubStore[i];
      return {
        raw: entry.data,
        slug: entry.slug as string,
        path: entry.file.path,
        mediaFiles: entry.mediaFiles!,
      };
    });

    entryIndexes.forEach(i => unpubStore.splice(i, 1));

    await Promise.all(
      unpubEntries.map(entry => this.persistEntry(entry, entry.mediaFiles, { commitMessage: '' })),
    );
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
