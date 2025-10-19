import semaphore from 'semaphore';
import unionBy from 'lodash/unionBy';
import sortBy from 'lodash/sortBy';

import { basename } from './path';

import type { Semaphore } from 'semaphore';
import type Cursor from './Cursor';
import type { AsyncLock } from './asyncLock';
import type { FileMetadata } from './API';

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
  data: string;
  file: { path: string; label?: string; id?: string | null; author?: string; updatedOn?: string };
}

export interface UnpublishedEntryDiff {
  id: string;
  path: string;
  newFile: boolean;
}

export interface UnpublishedEntry {
  pullRequestAuthor?: string;
  slug: string;
  collection: string;
  status: string;
  diffs: UnpublishedEntryDiff[];
  updatedAt: string;
}

export interface Map {
  get: <T>(key: string, defaultValue?: T) => T;
  getIn: <T>(key: string[], defaultValue?: T) => T;
  setIn: <T>(key: string[], value: T) => Map;
  set: <T>(key: string, value: T) => Map;
}

export type DataFile = {
  path: string;
  slug: string;
  raw: string;
  newPath?: string;
};

export type AssetProxy = {
  path: string;
  fileObj?: File;
  toBase64?: () => Promise<string>;
};

export type Entry = {
  dataFiles: DataFile[];
  assets: AssetProxy[];
};

export type PersistOptions = {
  newEntry?: boolean;
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
    always_fork?: boolean;
    branch?: string;
    api_root?: string;
    squash_merges?: boolean;
    use_graphql?: boolean;
    graphql_api_root?: string;
    preview_context?: string;
    identity_url?: string;
    gateway_url?: string;
    large_media_url?: string;
    use_large_media_transforms_in_media_library?: boolean;
    proxy_url?: string;
    auth_type?: string;
    app_id?: string;
    base_url?: string;
    cms_label_prefix?: string;
    api_version?: string;
    status_endpoint?: string;
  };
  auth: {
    use_oidc?: boolean;
    base_url?: string;
    auth_endpoint?: string;
    auth_token_endpoint?: string;
    app_id?: string;
    auth_token_endpoint_content_type?: string;
    email_claim?: string;
    full_name_claim?: string;
    first_name_claim?: string;
    last_name_claim?: string;
    avatar_url_claim?: string;
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

  persistEntry: (entry: Entry, opts: PersistOptions) => Promise<void>;
  persistMedia: (file: AssetProxy, opts: PersistOptions) => Promise<ImplementationMediaFile>;
  deleteFiles: (paths: string[], commitMessage: string) => Promise<void>;

  unpublishedEntries: () => Promise<string[]>;
  unpublishedEntry: (args: {
    id?: string;
    collection?: string;
    slug?: string;
  }) => Promise<UnpublishedEntry>;
  unpublishedEntryDataFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<string>;
  unpublishedEntryMediaFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<ImplementationMediaFile>;
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
    pathRegex?: RegExp,
  ) => Promise<ImplementationEntry[]>;
  traverseCursor?: (
    cursor: Cursor,
    action: string,
  ) => Promise<{ entries: ImplementationEntry[]; cursor: Cursor }>;

  isGitBackend?: () => boolean;
  status: () => Promise<{
    auth: { status: boolean };
    api: { status: boolean; statusPage: string };
  }>;
}

const MAX_CONCURRENT_DOWNLOADS = 10;

export type ImplementationFile = {
  id?: string | null | undefined;
  label?: string;
  path: string;
};

type ReadFile = (
  path: string,
  id: string | null | undefined,
  options: { parseText: boolean },
) => Promise<string | Blob>;

type ReadFileMetadata = (path: string, id: string | null | undefined) => Promise<FileMetadata>;

type CustomFetchFunc = (files: ImplementationFile[]) => Promise<ImplementationEntry[]>;

async function fetchFiles(
  files: ImplementationFile[],
  readFile: ReadFile,
  readFileMetadata: ReadFileMetadata,
  apiName: string,
) {
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
}

export async function entriesByFolder(
  listFiles: () => Promise<ImplementationFile[]>,
  readFile: ReadFile,
  readFileMetadata: ReadFileMetadata,
  apiName: string,
) {
  const files = await listFiles();
  return fetchFiles(files, readFile, readFileMetadata, apiName);
}

export async function entriesByFiles(
  files: ImplementationFile[],
  readFile: ReadFile,
  readFileMetadata: ReadFileMetadata,
  apiName: string,
) {
  return fetchFiles(files, readFile, readFileMetadata, apiName);
}

export async function unpublishedEntries(listEntriesKeys: () => Promise<string[]>) {
  try {
    const keys = await listEntriesKeys();
    return keys;
  } catch (error) {
    if (error.message === 'Not Found') {
      return Promise.resolve([]);
    }
    throw error;
  }
}

export function blobToFileObj(name: string, blob: Blob) {
  const options = name.match(/.svg$/) ? { type: 'image/svg+xml' } : {};
  return new File([blob], name, options);
}

export async function getMediaAsBlob(path: string, id: string | null, readFile: ReadFile) {
  let blob: Blob;
  if (path.match(/.svg$/)) {
    const text = (await readFile(path, id, { parseText: true })) as string;
    blob = new Blob([text], { type: 'image/svg+xml' });
  } else {
    blob = (await readFile(path, id, { parseText: false })) as Blob;
  }
  return blob;
}

export async function getMediaDisplayURL(
  displayURL: DisplayURL,
  readFile: ReadFile,
  semaphore: Semaphore,
) {
  const { path, id } = displayURL as DisplayURLObject;
  return new Promise<string>((resolve, reject) =>
    semaphore.take(() =>
      getMediaAsBlob(path, id, readFile)
        .then(blob => URL.createObjectURL(blob))
        .then(resolve, reject)
        .finally(() => semaphore.leave()),
    ),
  );
}

export async function runWithLock(lock: AsyncLock, func: Function, message: string) {
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
}

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

function getLocalKey({ branch, folder, extension, depth }: GetKeyArgs) {
  return `${LOCAL_KEY}.${branch}.${folder}.${extension}.${depth}`;
}

type PersistLocalTreeArgs = GetKeyArgs & {
  localForage: LocalForage;
  localTree: LocalTree;
};

type GetLocalTreeArgs = GetKeyArgs & {
  localForage: LocalForage;
};

export async function persistLocalTree({
  localForage,
  localTree,
  branch,
  folder,
  extension,
  depth,
}: PersistLocalTreeArgs) {
  await localForage.setItem<LocalTree>(
    getLocalKey({ branch, folder, extension, depth }),
    localTree,
  );
}

export async function getLocalTree({
  localForage,
  branch,
  folder,
  extension,
  depth,
}: GetLocalTreeArgs) {
  const localTree = await localForage.getItem<LocalTree>(
    getLocalKey({ branch, folder, extension, depth }),
  );
  return localTree;
}

type GetDiffFromLocalTreeMethods = {
  getDifferences: (
    to: string,
    from: string,
  ) => Promise<
    {
      oldPath: string;
      newPath: string;
      status: string;
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

async function getDiffFromLocalTree({
  branch,
  localTree,
  folder,
  getDifferences,
  filterFile,
  getFileId,
}: GetDiffFromLocalTreeArgs) {
  const diff = await getDifferences(branch.sha, localTree.head);
  const diffFiles = diff
    .filter(d => d.oldPath?.startsWith(folder) || d.newPath?.startsWith(folder))
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
}

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
    customFetch?: CustomFetchFunc;
  };

export async function allEntriesByFolder({
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
  customFetch,
}: AllEntriesByFolderArgs) {
  async function listAllFilesAndPersist() {
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
  }

  async function listFiles() {
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
        const deleted = diff.reduce((acc, d) => {
          acc[d.path] = d.deleted;
          return acc;
        }, {} as Record<string, boolean>);
        const newCopy = sortBy(
          unionBy(
            diff.filter(d => !deleted[d.path]),
            localTree.files.filter(f => !deleted[f.path]),
            file => file.path,
          ),
          file => file.path,
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
  }

  const files = await listFiles();
  if (customFetch) {
    return await customFetch(files);
  }
  return await fetchFiles(files, readFile, readFileMetadata, apiName);
}
