import { attempt, isEmpty, isError, take, unset } from 'lodash-es';

import { rawContent } from '@/lib/backend/index';
import {
  basename,
  ConfigurationError,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  dirname,
  EditorialWorkflowError,
  EntryLockManager,
  extname,
  randomUUID,
} from '@/lib/util/index';
import AuthenticationPage from './AuthenticationPage';

import type {
  BackendEntry,
  BackendFileRef,
  BackendImplementation,
  MediaFile,
  Note,
  PersistPayload,
} from '@/lib/backend/index';
import type {
  CmsAssetProxy,
  CmsConfig,
  CmsDataFile,
  CmsEntry,
  CmsEntryLockOwner,
  CmsPersistOptions,
  CmsUser,
  CursorCompatibleEntries,
} from '@/lib/util/index';

type RepoFile = { path: string, content: string | CmsAssetProxy };
type RepoTree = { [key: string]: RepoFile | RepoTree };

type Diff = {
  id: string,
  originalPath?: string | undefined,
  path: string,
  newFile: boolean,
  status: string,
  content: string | CmsAssetProxy,
};

type UnpublishedRepoEntry = {
  slug: string,
  collection: string,
  status: string,
  diffs: Diff[],
  updatedAt: string,
};

declare global {
  interface Window {
    repoFiles: RepoTree;
    repoFilesUnpublished: { [key: string]: UnpublishedRepoEntry };
    /** Editor notes, keyed `collection/slug` (decaporg #7563). */
    repoNotes: { [key: string]: Note[] };
  }
}

window.repoFiles = window.repoFiles || {};
window.repoFilesUnpublished = window.repoFilesUnpublished || [];
window.repoNotes = window.repoNotes || {};

// Module-level singleton (not per-instance) so every tab of the same
// dev-test/demo origin arbitrates against the same locks, mirroring how
// `window.repoFiles` above is shared content state rather than per-backend.
const entryLockManager = new EntryLockManager();

function getFile(path: string, tree: RepoTree) {
  const segments = path.split('/');
  let obj: RepoTree = tree;
  while (obj && segments.length) {
    obj = obj[segments.shift() as string] as RepoTree;
  }
  return (obj as unknown as RepoFile) || {};
}

function writeFile(path: string, content: string | CmsAssetProxy, tree: RepoTree) {
  const segments = path.split('/');
  let obj = tree;
  while (segments.length > 1) {
    const segment = segments.shift() as string;
    obj[segment] = obj[segment] || {};
    obj = obj[segment] as RepoTree;
  }
  (obj[segments.shift() as string] as RepoFile) = { content, path };
}

function deleteFile(path: string, tree: RepoTree) {
  unset(tree, path.split('/'));
}

const pageSize = 10;

// Discriminates the folder-listing cursor data shape produced by getCursor
// (the only cursor shape this test backend's traverseCursor understands)
// from any other cursor data it might be handed, so an unexpected cursor
// shape fails loudly instead of silently misbehaving via an unchecked type
// assertion.
type FolderCursorData = {
  folder: string,
  extension: string,
  index: number,
  pageCount: number,
  depth: number,
};

function isFolderCursorData(data: unknown): data is FolderCursorData {
  return (
    typeof data === 'object'
    && data !== null
    && typeof (data as Record<string, unknown>)['folder'] === 'string'
    && typeof (data as Record<string, unknown>)['extension'] === 'string'
    && typeof (data as Record<string, unknown>)['index'] === 'number'
    && typeof (data as Record<string, unknown>)['pageCount'] === 'number'
    && typeof (data as Record<string, unknown>)['depth'] === 'number'
  );
}

function getCursor(
  folder: string,
  extension: string,
  entries: BackendEntry[],
  index: number,
  depth: number,
) {
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
}

export function getFolderFiles(
  tree: RepoTree,
  folder: string,
  extension: string,
  depth: number,
  files = [] as RepoFile[],
  path = folder,
) {
  if (depth <= 0) {
    return files;
  }

  Object.keys(tree[folder] || {}).forEach(key => {
    if (extname(key)) {
      const file = (tree[folder] as RepoTree)[key] as RepoFile;
      if (!extension || key.endsWith(`.${extension}`)) {
        files.unshift({ content: file.content, path: `${path}/${key}` });
      }
    } else {
      const subTree = tree[folder] as RepoTree;
      return getFolderFiles(subTree, key, extension, depth - 1, files, `${path}/${key}`);
    }
  });

  return files;
}

// Returns the *direct* children of `folder` only — subdirectories tagged
// `{ isDirectory: true }`, leaf files carrying their proxy `content` —
// without recursively flattening deeper descendants the way `getFolderFiles`
// does. Backs `getMedia(folder, folderSupport: true)`, mirroring the
// single-folder listing contract azure/bitbucket/git-gateway/github/gitlab/
// proxy/dev-server both emit after PR #1554 (DCMS-1573).
export function getFolderChildren(tree: RepoTree, folder: string) {
  const segments = folder ? folder.split('/') : [];
  let node: RepoTree = tree;
  while (node && segments.length) {
    node = node[segments.shift() as string] as RepoTree;
  }

  return Object.keys(node || {}).map(name => {
    const path = folder ? `${folder}/${name}` : name;
    const value = node[name];
    return extname(name)
      ? { path, name, isDirectory: false as const, content: (value as RepoFile).content }
      : { path, name, isDirectory: true as const };
  });
}

export default class TestBackend implements BackendImplementation {
  mediaFolder: string;
  options: { initialWorkflowStatus?: string };

  constructor(config: CmsConfig, options = {}) {
    this.options = options;
    if (!config.media_folder) {
      throw new ConfigurationError(
        'The media_folder configuration is required for the Test Backend',
      );
    }
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

  restoreUser(user?: CmsUser) {
    return this.authenticate(user ? { login: user.login, name: user.name } : undefined);
  }

  // Synthetic auth for the dev-test demo: there's no real credential
  // exchange here, just a stable `CmsUser`-shaped identity so anything
  // gated on `state.auth.user` (e.g. DCMS-1414 advisory entry locking, see
  // ENTRY LOCKING below) is actually reachable from this backend. Falls
  // back to a fixed `test-user` identity when no login/name is supplied so
  // existing callers (and `authenticate()` with no args) keep working.
  // `AuthenticationPage` lets a user type a login/name so two tabs of the
  // same dev-test profile can sign in as different identities and
  // reproduce a lock conflict (see `dev-test/config.yml`).
  authenticate(
    credentials?:
      | { token?: string | Record<string, unknown>, login?: string | undefined, name?: string | undefined }
      | null
      | undefined,
  ) {
    const login = credentials?.login?.trim() || 'test-user';
    const name = credentials?.name?.trim() || login;
    return Promise.resolve({ login, name, token: 'test-repo-token' } as unknown as CmsUser);
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  traverseCursor(cursor: Cursor, action: string) {
    if (!isFolderCursorData(cursor.data)) {
      throw new Error(
        'traverseCursor: expected a folder-listing cursor produced by this backend, but received an incompatible cursor shape',
      );
    }
    const { folder, extension, index, pageCount, depth } = cursor.data;
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
      return 0;
    })();
    const allFiles = getFolderFiles(window.repoFiles, folder, extension, depth);
    const allEntries = allFiles.map(f => ({
      content: rawContent(f.content as string),
      file: { path: f.path, id: f.path },
    }));
    const entries = allEntries.slice(newIndex * pageSize, newIndex * pageSize + pageSize);
    const newCursor = getCursor(folder, extension, allEntries, newIndex, depth);
    return Promise.resolve({ entries, cursor: newCursor });
  }

  entriesByFolder(folder: string, extension: string, depth: number) {
    const files = folder ? getFolderFiles(window.repoFiles, folder, extension, depth) : [];
    const entries = files.map(f => ({
      content: rawContent(f.content as string),
      file: { path: f.path, id: f.path },
    }));
    const cursor = getCursor(folder, extension, entries, 0, depth);
    const ret = take(entries, pageSize);

    (ret as CursorCompatibleEntries<BackendEntry>)[CURSOR_COMPATIBILITY_SYMBOL] = cursor;
    return Promise.resolve(ret);
  }

  entriesByFiles(files: BackendFileRef[]) {
    return Promise.all(
      files.map(file => ({
        file,
        content: rawContent(getFile(file.path, window.repoFiles).content as string),
      })),
    );
  }

  getEntry(path: string) {
    const file = getFile(path, window.repoFiles);
    if (isEmpty(file)) {
      return Promise.reject(new Error(`Entry not found: ${path}`));
    }
    return Promise.resolve({
      file: { path, id: null },
      content: rawContent(file.content as string),
    });
  }

  unpublishedEntries() {
    return Promise.resolve(Object.keys(window.repoFilesUnpublished));
  }

  unpublishedEntry(
    { id, collection, slug }: { id?: string | undefined, collection?: string | undefined, slug?: string | undefined },
  ) {
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
    const file = entry.diffs.find(d => d.path === path);
    return file?.content as string;
  }

  async unpublishedEntryMediaFile(collection: string, slug: string, path: string) {
    const entry = window.repoFilesUnpublished[`${collection}/${slug}`];
    const file = entry.diffs.find(d => d.path === path);
    return this.normalizeAsset(file?.content as CmsAssetProxy);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    delete window.repoFilesUnpublished[`${collection}/${slug}`];
    return Promise.resolve();
  }

  async addOrUpdateUnpublishedEntry(
    key: string,
    dataFiles: CmsDataFile[],
    assetProxies: CmsAssetProxy[],
    slug: string,
    collection: string,
    status: string,
  ) {
    const diffs: Diff[] = [];
    dataFiles.forEach(dataFile => {
      const { path, newPath, raw } = dataFile;
      const currentDataFile = window.repoFilesUnpublished[key]?.diffs.find(d => d.path === path);
      const originalPath = currentDataFile ? currentDataFile.originalPath : path;
      diffs.push({
        originalPath,
        id: newPath || path,
        path: newPath || path,
        newFile: isEmpty(getFile(originalPath as string, window.repoFiles)),
        status: 'added',
        content: raw,
      });
    });
    assetProxies.forEach(a => {
      const asset = this.normalizeAsset(a);
      diffs.push({
        id: asset.id,
        path: asset.path,
        newFile: true,
        status: 'added',
        content: asset,
      });
    });
    window.repoFilesUnpublished[key] = {
      slug,
      collection,
      status,
      diffs,
      updatedAt: new Date().toISOString(),
    };
  }

  async persistEntry(entry: PersistPayload, options: CmsPersistOptions) {
    if (!('dataFiles' in entry)) throw new Error('Expected entry to have dataFiles property');
    if (options.useWorkflow) {
      const slug = entry.dataFiles[0].slug;
      const key = `${options.collectionName}/${slug}`;
      const currentEntry = window.repoFilesUnpublished[key];
      const status = currentEntry?.status || options.status || (this.options.initialWorkflowStatus as string);

      this.addOrUpdateUnpublishedEntry(
        key,
        entry.dataFiles,
        entry.assets,
        slug,
        options.collectionName as string,
        status,
      );
      return Promise.resolve();
    }

    entry.dataFiles.forEach(dataFile => {
      const { path, raw } = dataFile;
      writeFile(path, raw, window.repoFiles);
    });
    entry.assets.forEach(a => {
      writeFile(a.path, a, window.repoFiles);
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

    const tree = window.repoFiles;
    unpubEntry.diffs.forEach(d => {
      if (d.originalPath && !d.newFile) {
        const originalPath = d.originalPath;
        const sourceDir = dirname(originalPath);
        const destDir = dirname(d.path);
        const toMove = getFolderFiles(tree, originalPath.split('/')[0], '', 100).filter(f =>
          f.path.startsWith(sourceDir)
        );
        toMove.forEach(f => {
          deleteFile(f.path, tree);
          writeFile(f.path.replace(sourceDir, destDir), f.content, tree);
        });
      }
      writeFile(d.path, d.content, tree);
    });

    return Promise.resolve();
  }

  getMedia(mediaFolder = this.mediaFolder, folderSupport?: boolean) {
    if (folderSupport) {
      const children = getFolderChildren(window.repoFiles, mediaFolder);
      const assets = children.map(child => {
        if (child.isDirectory) {
          return {
            id: child.path,
            name: child.name,
            path: child.path,
            displayURL: { id: child.path, path: child.path },
            isDirectory: true,
          };
        }
        return {
          ...this.normalizeAsset(child.content as CmsAssetProxy),
          isDirectory: false,
        };
      });
      return Promise.resolve(assets);
    }

    const files = getFolderFiles(window.repoFiles, mediaFolder.split('/')[0], '', 100).filter(f =>
      f.path.startsWith(mediaFolder)
    );
    const assets = files.map(f => this.normalizeAsset(f.content as CmsAssetProxy));
    return Promise.resolve(assets);
  }

  async getMediaFile(path: string) {
    const asset = getFile(path, window.repoFiles).content as CmsAssetProxy;

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

  normalizeAsset(assetProxy: CmsAssetProxy): MediaFile & CmsAssetProxy {
    const fileObj = assetProxy.fileObj as File;
    const { name, size } = fileObj;
    const objectUrl = attempt(window.URL.createObjectURL, fileObj);
    const url = isError(objectUrl) ? '' : objectUrl;

    const normalizedAsset = {
      id: randomUUID(),
      name,
      size,
      path: assetProxy.path,
      url,
      displayURL: url,
      fileObj,
      toBase64: assetProxy.toBase64,
    };

    return normalizedAsset;
  }

  persistMedia(assetProxy: CmsAssetProxy) {
    const normalizedAsset = this.normalizeAsset(assetProxy);

    writeFile(assetProxy.path, assetProxy, window.repoFiles);

    return Promise.resolve(normalizedAsset);
  }

  deleteFiles(paths: string[]) {
    paths.forEach(path => {
      deleteFile(path, window.repoFiles);
    });

    return Promise.resolve();
  }

  // ===== EDITOR NOTES (in memory, decaporg #7563) =====

  private notesFor(collection: string, slug: string) {
    const key = `${collection}/${slug}`;
    window.repoNotes[key] ??= [];
    return window.repoNotes[key];
  }

  private findNote(collection: string, slug: string, noteId: string) {
    const notes = this.notesFor(collection, slug);
    const index = notes.findIndex(note => note.id === noteId);
    if (index === -1) {
      throw new Error(`Note with id ${noteId} not found`);
    }
    return { notes, index };
  }

  async getNotes(collection: string, slug: string): Promise<Note[]> {
    return [...this.notesFor(collection, slug)];
  }

  async addNote(collection: string, slug: string, note: Omit<Note, 'id'>): Promise<Note> {
    const newNote: Note = { ...note, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    this.notesFor(collection, slug).push(newNote);
    return newNote;
  }

  async updateNote(collection: string, slug: string, noteId: string, updates: Partial<Note>): Promise<Note> {
    const { notes, index } = this.findNote(collection, slug, noteId);
    const updatedNote = { ...notes[index], ...updates, id: noteId } as Note;
    notes[index] = updatedNote;
    return updatedNote;
  }

  async deleteNote(collection: string, slug: string, noteId: string): Promise<void> {
    const { notes, index } = this.findNote(collection, slug, noteId);
    notes.splice(index, 1);
  }

  async toggleNoteResolution(collection: string, slug: string, noteId: string): Promise<Note> {
    const { notes, index } = this.findNote(collection, slug, noteId);
    return this.updateNote(collection, slug, noteId, { resolved: !notes[index].resolved });
  }

  async getDeployPreview() {
    return null;
  }

  // ===== ENTRY LOCKING (reference implementation, DCMS-1414) =====
  //
  // Delegates to `EntryLockManager` against `localStorage` — locks are
  // therefore visible across every same-origin tab of this dev-test/demo
  // instance, which is enough to demo/exercise "being edited by X" and
  // stale-lock expiry without a server. A real multi-user backend needs a
  // server-arbitrated store instead so two
  // different *browsers*, not only two tabs of one, see the same lock.

  async getEntryLock(path: string) {
    return entryLockManager.get(path);
  }

  async acquireEntryLock(path: string, owner: CmsEntryLockOwner, opts?: { force?: boolean }) {
    return entryLockManager.acquire(path, owner, opts);
  }

  async releaseEntryLock(path: string, owner: CmsEntryLockOwner) {
    return entryLockManager.release(path, owner);
  }

  async refreshEntryLock(path: string, owner: CmsEntryLockOwner) {
    return entryLockManager.refresh(path, owner);
  }
}
