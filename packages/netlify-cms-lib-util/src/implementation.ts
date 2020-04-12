import semaphore, { Semaphore } from 'semaphore';
import { unionBy, sortBy } from 'lodash';
import Cursor from './Cursor';
import { AsyncLock } from './asyncLock';
import { FileMetadata } from './API';
import { basename } from './path';

export type DisplayURLObject = { id: string; path: string };

export type DisplayURL = DisplayURLObject | string;

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
  file: { path: string; label?: string; id?: string | null; author?: string; updatedOn?: string };
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

  isGitBackend?: () => boolean;
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

type ReadFileMetadata = (path: string, id: string | null | undefined) => Promise<FileMetadata>;

type ReadUnpublishedFile = (
  key: string,
) => Promise<{ metaData: Metadata; fileData: string; isModification: boolean; slug: string }>;

const fetchFiles = async (
  files: ImplementationFile[],
  readFile: ReadFile,
  readFileMetadata: ReadFileMetadata,
  apiName: string,
) => {
  const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
  const promises = [] as Promise<ImplementationEntry | { error: boolean }>[];
  files.forEach(file => {
    promises.push(
      new Promise(resolve =>
        sem.take(async () => {
          try {
            const [data, fileMetadata] = await Promise.all([
              readFile(file.path, file.id, { parseText: true }),
              readFileMetadata(file.path, file.id),
            ]);
            resolve({ file: { ...file, ...fileMetadata }, data: data as string });
            sem.leave();
          } catch (error) {
            sem.leave();
            console.error(`failed to load file from ${apiName}: ${file.path}`);
            resolve({ error: true });
          }
        }),
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
  readFileMetadata: ReadFileMetadata,
  apiName: string,
) => {
  const files = await listFiles();
  return fetchFiles(files, readFile, readFileMetadata, apiName);
};

export const entriesByFiles = async (
  files: ImplementationFile[],
  readFile: ReadFile,
  readFileMetadata: ReadFileMetadata,
  apiName: string,
) => {
  return fetchFiles(files, readFile, readFileMetadata, apiName);
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

const LOCAL_KEY = 'git.local';

type LocalTree = {
  head: string;
  files: { id: string; name: string; path: string }[];
};

type GetKeyArgs = {
  branch: string;
  folder: string;
  extension: string;
  depth: number;
};

const getLocalKey = ({ branch, folder, extension, depth }: GetKeyArgs) => {
  return `${LOCAL_KEY}.${branch}.${folder}.${extension}.${depth}`;
};

type PersistLocalTreeArgs = GetKeyArgs & {
  localForage: LocalForage;
  localTree: LocalTree;
};

type GetLocalTreeArgs = GetKeyArgs & {
  localForage: LocalForage;
};

export const persistLocalTree = async ({
  localForage,
  localTree,
  branch,
  folder,
  extension,
  depth,
}: PersistLocalTreeArgs) => {
  await localForage.setItem<LocalTree>(
    getLocalKey({ branch, folder, extension, depth }),
    localTree,
  );
};

export const getLocalTree = async ({
  localForage,
  branch,
  folder,
  extension,
  depth,
}: GetLocalTreeArgs) => {
  const localTree = await localForage.getItem<LocalTree>(
    getLocalKey({ branch, folder, extension, depth }),
  );
  return localTree;
};

type GetDiffFromLocalTreeMethods = {
  getDifferences: (
    to: string,
    from: string,
  ) => Promise<
    {
      oldPath: string;
      newPath: string;
      status: string;
      binary: boolean;
    }[]
  >;
  filterFile: (file: { path: string; name: string }) => boolean;
  getFileId: (path: string) => Promise<string>;
};

type GetDiffFromLocalTreeArgs = GetDiffFromLocalTreeMethods & {
  branch: { name: string; sha: string };
  localTree: LocalTree;
  folder: string;
  extension: string;
  depth: number;
};

const getDiffFromLocalTree = async ({
  branch,
  localTree,
  folder,
  getDifferences,
  filterFile,
  getFileId,
}: GetDiffFromLocalTreeArgs) => {
  const diff = await getDifferences(branch.sha, localTree.head);
  const diffFiles = diff
    .filter(d => (d.oldPath?.startsWith(folder) || d.newPath?.startsWith(folder)) && !d.binary)
    .reduce((acc, d) => {
      if (d.status === 'renamed') {
        acc.push({
          path: d.oldPath,
          name: basename(d.oldPath),
          deleted: true,
        });
        acc.push({
          path: d.newPath,
          name: basename(d.newPath),
          deleted: false,
        });
      } else if (d.status === 'deleted') {
        acc.push({
          path: d.oldPath,
          name: basename(d.oldPath),
          deleted: true,
        });
      } else {
        acc.push({
          path: d.newPath || d.oldPath,
          name: basename(d.newPath || d.oldPath),
          deleted: false,
        });
      }

      return acc;
    }, [] as { path: string; name: string; deleted: boolean }[])

    .filter(filterFile);

  const diffFilesWithIds = await Promise.all(
    diffFiles.map(async file => {
      if (!file.deleted) {
        const id = await getFileId(file.path);
        return { ...file, id };
      } else {
        return { ...file, id: '' };
      }
    }),
  );

  return diffFilesWithIds;
};

type AllEntriesByFolderArgs = GetKeyArgs &
  GetDiffFromLocalTreeMethods & {
    listAllFiles: (
      folder: string,
      extension: string,
      depth: number,
    ) => Promise<ImplementationFile[]>;
    readFile: ReadFile;
    readFileMetadata: ReadFileMetadata;
    getDefaultBranch: () => Promise<{ name: string; sha: string }>;
    isShaExistsInBranch: (branch: string, sha: string) => Promise<boolean>;
    apiName: string;
    localForage: LocalForage;
  };

export const allEntriesByFolder = async ({
  listAllFiles,
  readFile,
  readFileMetadata,
  apiName,
  branch,
  localForage,
  folder,
  extension,
  depth,
  getDefaultBranch,
  isShaExistsInBranch,
  getDifferences,
  getFileId,
  filterFile,
}: AllEntriesByFolderArgs) => {
  const listAllFilesAndPersist = async () => {
    const files = await listAllFiles(folder, extension, depth);
    const branch = await getDefaultBranch();
    await persistLocalTree({
      localForage,
      localTree: {
        head: branch.sha,
        files: files.map(f => ({ id: f.id!, path: f.path, name: basename(f.path) })),
      },
      branch: branch.name,
      depth,
      extension,
      folder,
    });
    return files;
  };

  const listFiles = async () => {
    const localTree = await getLocalTree({ localForage, branch, folder, extension, depth });
    if (localTree) {
      const branch = await getDefaultBranch();
      // if the branch was forced pushed the local tree sha can be removed from the remote tree
      const localTreeInBranch = await isShaExistsInBranch(branch.name, localTree.head);
      if (!localTreeInBranch) {
        console.log(
          `Can't find local tree head '${localTree.head}' in branch '${branch.name}', rebuilding local tree`,
        );
        return listAllFilesAndPersist();
      }
      const diff = await getDiffFromLocalTree({
        branch,
        localTree,
        folder,
        extension,
        depth,
        getDifferences,
        getFileId,
        filterFile,
      }).catch(e => {
        console.log('Failed getting diff from local tree:', e);
        return null;
      });

      if (!diff) {
        console.log(`Diff is null, rebuilding local tree`);
        return listAllFilesAndPersist();
      }

      if (diff.length === 0) {
        // return local copy
        return localTree.files;
      } else {
        // refresh local copy
        const identity = (file: { path: string }) => file.path;
        const deleted = diff.reduce((acc, d) => {
          acc[d.path] = d.deleted;
          return acc;
        }, {} as Record<string, boolean>);
        const newCopy = sortBy(
          unionBy(
            diff.filter(d => !deleted[d.path]),
            localTree.files.filter(f => !deleted[f.path]),
            identity,
          ),
          identity,
        );

        await persistLocalTree({
          localForage,
          localTree: { head: branch.sha, files: newCopy },
          branch: branch.name,
          depth,
          extension,
          folder,
        });

        return newCopy;
      }
    } else {
      return listAllFilesAndPersist();
    }
  };

  const files = await listFiles();
  return fetchFiles(files, readFile, readFileMetadata, apiName);
};
