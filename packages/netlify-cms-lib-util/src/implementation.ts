import semaphore, { Semaphore } from 'semaphore';
import Cursor from './Cursor';
import { AsyncLock } from './asyncLock';

export type DisplayURLObject = { id: string; path: string };

export type DisplayURL =
  | DisplayURLObject
  | string
  | { original: DisplayURL; path?: string; largeMedia?: string };

export interface ImplementationMediaFile {
  name: string;
  id: string;
  size?: number;
  displayURL?: DisplayURL;
  path: string;
  draft?: boolean;
  url?: string;
  file?: File;
}

export interface UnpublishedEntryMediaFile {
  id: string;
  path: string;
}

export interface ImplementationEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: string;
  file: { path: string; label?: string; id?: string | null };
  slug?: string;
  mediaFiles?: ImplementationMediaFile[];
  metaData?: { collection: string; status: string };
  isModification?: boolean;
}

export interface Map {
  get: <T>(key: string, defaultValue?: T) => T;
  getIn: <T>(key: string[], defaultValue?: T) => T;
  setIn: <T>(key: string[], value: T) => Map;
  set: <T>(key: string, value: T) => Map;
}

export type AssetProxy = {
  path: string;
  fileObj?: File;
  toBase64?: () => Promise<string>;
};

export type Entry = { path: string; slug: string; raw: string };

export type PersistOptions = {
  newEntry?: boolean;
  parsedData?: { title: string; description: string };
  commitMessage: string;
  collectionName?: string;
  useWorkflow?: boolean;
  unpublished?: boolean;
  status?: string;
};

export type DeleteOptions = {};

export type Credentials = { token: string | {}; refresh_token?: string };

export type User = Credentials & {
  backendName?: string;
  login?: string;
  name: string;
  useOpenAuthoring?: boolean;
};

export type Config = {
  backend: {
    repo?: string | null;
    open_authoring?: boolean;
    branch?: string;
    api_root?: string;
    squash_merges?: boolean;
    use_graphql?: boolean;
    preview_context?: string;
    identity_url?: string;
    gateway_url?: string;
    large_media_url?: string;
    use_large_media_transforms_in_media_library?: boolean;
    proxy_url?: string;
  };
  media_folder: string;
  base_url?: string;
  site_id?: string;
};

export interface Implementation {
  authComponent: () => void;
  restoreUser: (user: User) => Promise<User>;

  authenticate: (credentials: Credentials) => Promise<User>;
  logout: () => Promise<void> | void | null;
  getToken: () => Promise<string | null>;

  getEntry: (path: string) => Promise<ImplementationEntry>;
  entriesByFolder: (
    folder: string,
    extension: string,
    depth: number,
  ) => Promise<ImplementationEntry[]>;
  entriesByFiles: (files: ImplementationFile[]) => Promise<ImplementationEntry[]>;

  getMediaDisplayURL?: (displayURL: DisplayURL) => Promise<string>;
  getMedia: (folder?: string) => Promise<ImplementationMediaFile[]>;
  getMediaFile: (path: string) => Promise<ImplementationMediaFile>;

  persistEntry: (obj: Entry, assetProxies: AssetProxy[], opts: PersistOptions) => Promise<void>;
  persistMedia: (file: AssetProxy, opts: PersistOptions) => Promise<ImplementationMediaFile>;
  deleteFile: (path: string, commitMessage: string) => Promise<void>;

  unpublishedEntries: () => Promise<ImplementationEntry[]>;
  unpublishedEntry: (collection: string, slug: string) => Promise<ImplementationEntry>;
  updateUnpublishedEntryStatus: (
    collection: string,
    slug: string,
    newStatus: string,
  ) => Promise<void>;
  publishUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  deleteUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  getDeployPreview: (
    collectionName: string,
    slug: string,
  ) => Promise<{ url: string; status: string } | null>;

  allEntriesByFolder?: (
    folder: string,
    extension: string,
    depth: number,
  ) => Promise<ImplementationEntry[]>;
  traverseCursor?: (
    cursor: Cursor,
    action: string,
  ) => Promise<{ entries: ImplementationEntry[]; cursor: Cursor }>;
}

const MAX_CONCURRENT_DOWNLOADS = 10;

export type ImplementationFile = {
  id?: string | null | undefined;
  label?: string;
  path: string;
};

type Metadata = {
  objects: { entry: { path: string } };
  collection: string;
  status: string;
};

type ReadFile = (
  path: string,
  id: string | null | undefined,
  options: { parseText: boolean },
) => Promise<string | Blob>;
type ReadUnpublishedFile = (
  key: string,
) => Promise<{ metaData: Metadata; fileData: string; isModification: boolean; slug: string }>;

const fetchFiles = async (files: ImplementationFile[], readFile: ReadFile, apiName: string) => {
  const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
  const promises = [] as Promise<ImplementationEntry | { error: boolean }>[];
  files.forEach(file => {
    promises.push(
      new Promise(resolve =>
        sem.take(() =>
          readFile(file.path, file.id, { parseText: true })
            .then(data => {
              resolve({ file, data: data as string });
              sem.leave();
            })
            .catch((error = true) => {
              sem.leave();
              console.error(`failed to load file from ${apiName}: ${file.path}`);
              resolve({ error });
            }),
        ),
      ),
    );
  });
  return Promise.all(promises).then(loadedEntries =>
    loadedEntries.filter(loadedEntry => !(loadedEntry as { error: boolean }).error),
  ) as Promise<ImplementationEntry[]>;
};

const fetchUnpublishedFiles = async (
  keys: string[],
  readUnpublishedFile: ReadUnpublishedFile,
  apiName: string,
) => {
  const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
  const promises = [] as Promise<ImplementationEntry | { error: boolean }>[];
  keys.forEach(key => {
    promises.push(
      new Promise(resolve =>
        sem.take(() =>
          readUnpublishedFile(key)
            .then(data => {
              if (data === null || data === undefined) {
                resolve({ error: true });
                sem.leave();
              } else {
                resolve({
                  slug: data.slug,
                  file: { path: data.metaData.objects.entry.path, id: null },
                  data: data.fileData,
                  metaData: data.metaData,
                  isModification: data.isModification,
                });
                sem.leave();
              }
            })
            .catch((error = true) => {
              sem.leave();
              console.error(`failed to load file from ${apiName}: ${key}`);
              resolve({ error });
            }),
        ),
      ),
    );
  });
  return Promise.all(promises).then(loadedEntries =>
    loadedEntries.filter(loadedEntry => !(loadedEntry as { error: boolean }).error),
  ) as Promise<ImplementationEntry[]>;
};

export const entriesByFolder = async (
  listFiles: () => Promise<ImplementationFile[]>,
  readFile: ReadFile,
  apiName: string,
) => {
  const files = await listFiles();
  return fetchFiles(files, readFile, apiName);
};

export const entriesByFiles = async (
  files: ImplementationFile[],
  readFile: ReadFile,
  apiName: string,
) => {
  return fetchFiles(files, readFile, apiName);
};

export const unpublishedEntries = async (
  listEntriesKeys: () => Promise<string[]>,
  readUnpublishedFile: ReadUnpublishedFile,
  apiName: string,
) => {
  try {
    const keys = await listEntriesKeys();
    const entries = await fetchUnpublishedFiles(keys, readUnpublishedFile, apiName);
    return entries;
  } catch (error) {
    if (error.message === 'Not Found') {
      return Promise.resolve([]);
    }
    throw error;
  }
};

export const blobToFileObj = (name: string, blob: Blob) => {
  const options = name.match(/.svg$/) ? { type: 'image/svg+xml' } : {};
  return new File([blob], name, options);
};

export const getMediaAsBlob = async (path: string, id: string | null, readFile: ReadFile) => {
  let blob: Blob;
  if (path.match(/.svg$/)) {
    const text = (await readFile(path, id, { parseText: true })) as string;
    blob = new Blob([text], { type: 'image/svg+xml' });
  } else {
    blob = (await readFile(path, id, { parseText: false })) as Blob;
  }
  return blob;
};

export const getMediaDisplayURL = async (
  displayURL: DisplayURL,
  readFile: ReadFile,
  semaphore: Semaphore,
) => {
  const { path, id } = displayURL as DisplayURLObject;
  return new Promise<string>((resolve, reject) =>
    semaphore.take(() =>
      getMediaAsBlob(path, id, readFile)
        .then(blob => URL.createObjectURL(blob))
        .then(resolve, reject)
        .finally(() => semaphore.leave()),
    ),
  );
};

export const runWithLock = async (lock: AsyncLock, func: Function, message: string) => {
  try {
    const acquired = await lock.acquire();
    if (!acquired) {
      console.warn(message);
    }

    const result = await func();
    return result;
  } finally {
    lock.release();
  }
};
