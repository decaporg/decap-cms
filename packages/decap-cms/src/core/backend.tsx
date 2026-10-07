import { flatten, get, set, sortBy, trim, uniq } from 'lodash-es';

import { rawContent } from '@/lib/backend/index';
import {
  asyncLock,
  basename,
  blobToFileObj,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  dirname,
  EDITORIAL_WORKFLOW_ERROR,
  extname,
  fuzzyFilter,
  getPathDepth,
  join,
  localForage,
  LocalSearchError,
} from '@/lib/util/index';
import queryCore, { MEDIA_TAG } from '@/lib/util/queryCore';
import { stringTemplate } from '@/lib/widgets/index';
import { FILES, FOLDER } from './constants/collectionTypes';
import { status } from './constants/publishModes';
import { resolveFormat } from './formats/formats';
import { contentExists, entryDataFromContent, legacyRaw } from './lib/backendEntry';
import { commitMessageFormatter, previewUrlFormatter, slugFormatter } from './lib/formatters';
import {
  formatI18nBackup,
  getFilePaths,
  getI18nBackup,
  getI18nDataFiles,
  getI18nEntry,
  getI18nFiles,
  getI18nFilesDepth,
  getI18nInfo,
  groupEntries,
  hasI18n,
  I18N_STRUCTURE,
} from './lib/i18n';
import { getBackend, invokeEvent } from './lib/registry';
import { sanitizeChar } from './lib/urlHelper';
import {
  selectAllowDeletion,
  selectAllowNewEntries,
  selectEntryPath,
  selectEntrySlug,
  selectFieldsComments,
  selectFileEntryLabel,
  selectFolderEntryExtension,
  selectHasMetaPath,
  selectInferredField,
  selectMediaFolders,
} from './reducers/collections';
import { selectUseWorkflow } from './reducers/config';
import { selectEntry, selectMediaFilePath } from './reducers/entries';
import { selectCustomPath } from './reducers/entryDraft';
import { selectIntegration } from './reducers/integrations';
import { createEntry } from './valueObjects/Entry';

import type {
  BackendEntry,
  BackendEntryContent,
  BackendImplementation,
  Note,
  NotesWatchCallbacks,
  UnpublishedEntry,
  UnpublishedEntryDiff,
} from '@/lib/backend/index';
import type {
  CmsCollectionFile,
  CmsCollectionFileState,
  CmsCollectionState,
  CmsConfig,
  CmsEntry,
  CmsEntryField,
  CmsFilterRule,
  FuzzyFilterResult,
} from '@/lib/util/index';
import type {
  AsyncLock,
  CmsCredentials,
  CmsDataFile,
  CmsDisplayURL,
  CmsEntryLock,
  CmsEntryLockOwner,
  CmsGetMediaPageOptions,
  CmsUser,
  CursorCompatibleEntries,
} from '@/lib/util/index';
import type { I18nInfo } from './lib/i18n';
import type { EntryDraft } from './reducers/entryDraft';
import type AssetProxy from './valueObjects/AssetProxy';
import type { CompleteEntryValue, EntryValue } from './valueObjects/Entry';

// State type used in this file - represents the Redux store shape
interface State {
  config: CmsConfig;
  integrations: unknown;
  mediaLibrary: { files?: unknown[] };
  entries: unknown;
}

const { extractTemplateVars, dateParsers, expandPath } = stringTemplate;

function updateAssetProxies(
  assetProxies: AssetProxy[],
  config: CmsConfig,
  collection: CmsCollectionState,
  entryDraft: EntryDraft,
  path: string,
) {
  assetProxies.map(asset => {
    // update media files path based on entry path
    const oldPath = asset.path || '';
    const newPath = selectMediaFilePath(
      config,
      collection,
      { ...entryDraft.entry, path } as CmsEntry,
      oldPath,
      asset.field as CmsEntryField | undefined,
    );
    asset.path = newPath;
  });
}

export class LocalStorageAuthStore {
  storageKey = 'decap-cms-user';

  retrieve() {
    const data = window.localStorage.getItem(this.storageKey);
    return data && JSON.parse(data);
  }

  store(userData: unknown) {
    window.localStorage.setItem(this.storageKey, JSON.stringify(userData));
  }

  logout() {
    window.localStorage.removeItem(this.storageKey);
  }
}

function getEntryBackupKey(collectionName?: string, slug?: string) {
  const baseKey = 'backup';
  if (!collectionName) {
    return baseKey;
  }
  const suffix = slug ? `.${slug}` : '';
  return `${baseKey}.${collectionName}${suffix}`;
}

function getEntryField(field: string, entry: EntryValue) {
  const value = get(entry.data, field);
  if (value !== undefined && value !== null) {
    return String(value);
  } else {
    const firstFieldPart = field.split('.')[0];
    if (entry[firstFieldPart as keyof EntryValue]) {
      // allows searching using entry.slug/entry.path etc.
      return entry[firstFieldPart as keyof EntryValue];
    } else {
      return '';
    }
  }
}

export type SearchClause =
  | { field: string, value: string, range?: undefined }
  | { field: string, value?: undefined, range: [string, string] }
  | { field?: undefined, value: string, range?: undefined };

export function parseSearchTerm(searchTerm: string) {
  const clauses: SearchClause[] = [];
  const freeTerms: string[] = [];
  const tokenPattern = /([A-Za-z0-9_.-]+):(?:"([^"]*)"|(\S+))|"([^"]+)"|(\S+)/g;

  for (const match of searchTerm.matchAll(tokenPattern)) {
    const [, field, quotedFieldValue, fieldValue, quotedValue, freeTerm] = match;
    if (field) {
      const value = quotedFieldValue ?? fieldValue ?? '';
      const range = value.split('..');
      clauses.push(
        range.length === 2
          ? { field, range: [range[0], range[1]] }
          : { field, value },
      );
    } else if (quotedValue) {
      clauses.push({ value: quotedValue });
    } else if (freeTerm) {
      freeTerms.push(freeTerm);
    }
  }

  return { clauses, freeText: freeTerms.join(' ') };
}

export function isAdvancedSearchTerm(searchTerm: string) {
  return parseSearchTerm(searchTerm).clauses.length > 0;
}

function compareRangeValue(value: string, boundary: string, upperBoundary = false) {
  const valueNumber = Number(value);
  const boundaryNumber = Number(boundary);
  if (Number.isFinite(valueNumber) && Number.isFinite(boundaryNumber)) {
    return valueNumber - boundaryNumber;
  }

  const valueDate = Date.parse(value);
  let boundaryDate = Date.parse(boundary);
  if (!Number.isNaN(valueDate) && !Number.isNaN(boundaryDate)) {
    if (upperBoundary && /^\d{4}-\d{2}-\d{2}$/.test(boundary)) {
      boundaryDate += 24 * 60 * 60 * 1000 - 1;
    }
    return valueDate - boundaryDate;
  }

  return value.localeCompare(boundary);
}

export function matchesSearchClauses(entry: EntryValue, searchFields: string[], clauses: SearchClause[]) {
  return clauses.every(clause => {
    if (!clause.field) {
      const phrase = (clause.value ?? '').toLowerCase();
      return searchFields.some(field => String(getEntryField(field, entry)).toLowerCase().includes(phrase));
    }
    if (!searchFields.includes(clause.field)) {
      return false;
    }

    const fieldValue = String(getEntryField(clause.field, entry));
    if (clause.range) {
      if (!fieldValue) {
        return false;
      }
      const [start, end] = clause.range;
      return (
        (!start || compareRangeValue(fieldValue, start) >= 0)
        && (!end || compareRangeValue(fieldValue, end, true) <= 0)
      );
    }
    return fieldValue.toLowerCase().includes(clause.value.toLowerCase());
  });
}

export function extractSearchFields(searchFields: string[]) {
  return (entry: EntryValue) =>
    searchFields.reduce((acc, field) => {
      const value = getEntryField(field, entry);
      if (value) {
        return `${acc} ${value}`;
      } else {
        return acc;
      }
    }, '');
}

export function getCollectionSearchFields(collection: CmsCollectionState): string[] {
  if (collection.search_fields?.length) {
    return uniq(collection.search_fields);
  }

  const summary = (collection.summary || '') as string;
  const summaryFields = extractTemplateVars(summary);

  let searchFields: (string | null | undefined)[] = [];

  if (collection.type === FILES) {
    (collection.files || []).forEach((f: CmsCollectionFileState) => {
      const topLevelFields = (f.fields || []).map((field: CmsEntryField) => field.name);
      searchFields = [...searchFields, ...topLevelFields];
    });
  } else {
    searchFields = [
      selectInferredField(collection, 'title'),
      selectInferredField(collection, 'shortTitle'),
      selectInferredField(collection, 'author'),
      ...summaryFields.map(elem => {
        if (dateParsers[elem]) {
          return selectInferredField(collection, 'date');
        }
        return elem;
      }),
    ];
  }

  return uniq(searchFields.filter(Boolean) as string[]);
}

export function expandSearchEntries(entries: EntryValue[], searchFields: string[]) {
  // expand the entries for the purpose of the search
  const expandedEntries = entries.reduce(
    (acc, e) => {
      const expandedFields = searchFields.reduce((acc, f) => {
        const fields = expandPath({ data: e.data, path: f });
        acc.push(...fields);
        return acc;
      }, [] as string[]);

      for (let i = 0; i < expandedFields.length; i++) {
        acc.push({ ...e, field: expandedFields[i] });
      }

      return acc;
    },
    [] as (EntryValue & { field: string })[],
  );

  return expandedEntries;
}

export function mergeExpandedEntries(entries: (EntryValue & { field: string })[]) {
  // merge the search results by slug and only keep data that matched the search
  const fields = entries.map(f => f.field);
  const arrayPaths: Record<string, Set<string>> = {};

  const merged = entries.reduce(
    (acc, e) => {
      if (!acc[e.slug]) {
        const { field, ...rest } = e;
        acc[e.slug] = rest;
        arrayPaths[e.slug] = new Set();
      }

      const nestedFields = e.field.split('.');
      let value = acc[e.slug].data;
      for (let i = 0; i < nestedFields.length; i++) {
        value = value[nestedFields[i]];
        if (Array.isArray(value)) {
          const path = nestedFields.slice(0, i + 1).join('.');
          arrayPaths[e.slug] = arrayPaths[e.slug].add(path);
        }
      }

      return acc;
    },
    {} as Record<string, EntryValue>,
  );

  // this keeps the search score sorting order designated by the order in entries
  // and filters non matching items
  Object.keys(merged).forEach(slug => {
    const data = merged[slug].data;
    for (const path of Array.from(arrayPaths[slug])) {
      const array = get(data, path) as unknown[];
      const filtered = array.filter((_, index) => {
        return fields.some(f => `${f}.`.startsWith(`${path}.${index}.`));
      });
      filtered.sort((a, b) => {
        const indexOfA = array.indexOf(a);
        const indexOfB = array.indexOf(b);
        const pathOfA = `${path}.${indexOfA}.`;
        const pathOfB = `${path}.${indexOfB}.`;

        const matchingFieldIndexA = fields.findIndex(f => `${f}.`.startsWith(pathOfA));
        const matchingFieldIndexB = fields.findIndex(f => `${f}.`.startsWith(pathOfB));

        return matchingFieldIndexA - matchingFieldIndexB;
      });

      set(data, path, filtered);
    }
  });

  return Object.values(merged);
}

function sortByScore(a: FuzzyFilterResult<EntryValue>, b: FuzzyFilterResult<EntryValue>) {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
}

export function slugFromCustomPath(collection: CmsCollectionState, customPath: string) {
  const folderPath = (collection.folder || '') as string;
  const entryPath = customPath.toLowerCase().replace(folderPath.toLowerCase(), '');
  const slug = join(dirname(trim(entryPath, '/')), basename(entryPath, extname(customPath)));
  return slug;
}

interface AuthStore {
  retrieve: () => CmsUser;
  store: (user: CmsUser) => void;
  logout: () => void;
}

interface BackendOptions {
  backendName: string;
  config: CmsConfig;
  authStore?: AuthStore;
}

// Assembled from backend media payloads, which report these fields
// inconsistently, so an explicitly-`undefined` field is "not reported" rather
// than a key the producer must omit.
export interface MediaFile {
  name: string;
  id: string;
  size?: number | undefined;
  displayURL?: CmsDisplayURL | undefined;
  path: string;
  draft?: boolean | undefined;
  url?: string | undefined;
  file?: File | undefined;
  field?: CmsEntryField | undefined;
}

interface BackupEntry {
  raw: string;
  path: string;
  mediaFiles: MediaFile[];
  i18n?: Record<string, { raw: string }>;
}

// `localForage.ts` may be backed by a `localStorage` + `JSON.stringify`/`JSON.parse`
// shim (see `src/lib/util/localForage.ts`) rather than a store that supports structured
// cloning. `File`/`Blob` instances have no own enumerable properties, so they would
// otherwise round-trip as `{}`. Encode/decode them explicitly so draft backups survive
// a JSON round-trip.
export const SERIALIZED_FILE_TYPE = 'DecapCmsSerializedFile';

interface SerializedFile {
  __type: typeof SERIALIZED_FILE_TYPE;
  name: string;
  type: string;
  lastModified: number;
  base64: string;
}

function isSerializedFile(value: unknown): value is SerializedFile {
  return (
    !!value
    && typeof value === 'object'
    && (value as Partial<SerializedFile>).__type === SERIALIZED_FILE_TYPE
    && typeof (value as Partial<SerializedFile>).base64 === 'string'
  );
}

async function serializeFileForBackup(file: File): Promise<SerializedFile> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    __type: SERIALIZED_FILE_TYPE,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    base64: btoa(binary),
  };
}

function deserializeFileFromBackup(data: SerializedFile): File {
  const binary = atob(data.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], data.name, { type: data.type, lastModified: data.lastModified });
}

// Recover a `File`/`Blob` from a raw draft-backup media entry, tolerating both
// serialized descriptors written by `persistLocalDraftBackup` and legacy/corrupted
// entries (e.g. a `File` that lost its bytes to a lossy JSON round-trip and
// deserialized as a plain, non-Blob object).
function restoreBackupFile(rawFile: unknown): File | Blob | undefined {
  if (isSerializedFile(rawFile)) {
    return deserializeFileFromBackup(rawFile);
  }
  if (rawFile instanceof Blob) {
    return rawFile;
  }
  return undefined;
}

interface PersistArgs {
  config: CmsConfig;
  collection: CmsCollectionState;
  entryDraft: EntryDraft;
  assetProxies: AssetProxy[];
  usedSlugs: string[];
  unpublished?: boolean;
  status?: string;
}

interface ImplementationInitOptions {
  useWorkflow: boolean;
  updateUserCredentials: (credentials: CmsCredentials) => void;
  initialWorkflowStatus: string;
  /**
   * For the implementation to signal that the user's session ended
   * unrecoverably outside a user action (e.g. an expired access token whose
   * refresh grant was rejected). The app treats it as a logout, so the user
   * gets the login screen instead of every subsequent request failing.
   */
  onSessionExpired: () => void;
}

type Implementation = BackendImplementation & {
  init: (config: CmsConfig, options: ImplementationInitOptions) => Implementation,
};

function prepareMetaPath(path: string, collection: CmsCollectionState) {
  if (!selectHasMetaPath(collection)) {
    return path;
  }
  const dir = dirname(path);
  return dir.slice((collection.folder ?? '').length + 1) || '/';
}

function collectionDepth(collection: CmsCollectionState) {
  let depth;
  depth = collection.nested?.depth || getPathDepth((collection.path || '') as string);

  if (hasI18n(collection)) {
    depth = getI18nFilesDepth(collection, depth);
  }

  return depth;
}

function i18nRulestring(ruleString: string, { defaultLocale, structure }: I18nInfo): string {
  if (structure === I18N_STRUCTURE.MULTIPLE_FOLDERS) {
    return `${defaultLocale}\\/${ruleString}`;
  }

  if (structure === I18N_STRUCTURE.MULTIPLE_FILES) {
    return `${ruleString}\\.${defaultLocale}\\..*`;
  }

  return ruleString;
}

function collectionRegex(collection: CmsCollectionState): RegExp | undefined {
  let ruleString = '';

  if (collection.path) {
    ruleString = `${collection.folder}/${collection.path}`.replace(/{{.*}}/gm, '(.*)');
  }

  if (hasI18n(collection)) {
    ruleString = i18nRulestring(ruleString, getI18nInfo(collection) as I18nInfo);
  }

  return ruleString ? new RegExp(ruleString) : undefined;
}

// Discriminates the `collectionEntries` cursor data shape (the only cursor
// shape wrapData/unwrapData currently produce) from any other cursor data
// that might reach traverseCursor, so an unexpected cursor shape fails
// loudly instead of silently misbehaving via an unchecked type assertion.
type CollectionEntriesCursorData = {
  cursorType: 'collectionEntries',
  collection: CmsCollectionState,
};

function isCollectionEntriesCursorData(
  data: Record<string, unknown>,
): data is CollectionEntriesCursorData {
  return data['cursorType'] === 'collectionEntries' && data['collection'] != null;
}

export class Backend {
  implementation: Implementation;
  backendName: string;
  config: CmsConfig;
  authStore: AuthStore | undefined;
  user?: CmsUser | null;
  backupSync: AsyncLock;

  private sessionExpiredListeners = new Set<() => void>();

  /**
   * Subscribe to unrecoverable session expiry reported by the implementation
   * (see `ImplementationInitOptions.onSessionExpired`). Returns the
   * unsubscribe function. The app layer wires this to a logout dispatch.
   */
  onSessionExpired(listener: () => void): () => void {
    this.sessionExpiredListeners.add(listener);
    return () => {
      this.sessionExpiredListeners.delete(listener);
    };
  }

  /**
   * Ask the implementation to proactively refresh its credentials (no-op for
   * backends without refreshable sessions). Transient failures are swallowed:
   * the lazy per-request refresh remains the fallback, and an unrecoverably
   * dead session is reported through `onSessionExpired` by the
   * implementation itself.
   */
  async ensureFreshSession(): Promise<void> {
    try {
      await this.implementation.ensureFreshSession?.();
    } catch (e: unknown) {
      console.warn('ensureFreshSession', (e as Error).message);
    }
  }

  constructor(implementation: Implementation, { backendName, authStore, config }: BackendOptions) {
    // We can't reliably run this on exit, so we do cleanup on load.
    this.deleteAnonymousBackup();
    this.config = config;
    this.implementation = implementation.init(this.config, {
      useWorkflow: selectUseWorkflow(this.config),
      updateUserCredentials: this.updateUserCredentials,
      initialWorkflowStatus: Object.values(status)[0] ?? '',
      onSessionExpired: () => {
        for (const listener of this.sessionExpiredListeners) listener();
      },
    });
    this.backendName = backendName;
    this.authStore = authStore;
    if (this.implementation === null) {
      throw new Error('Cannot instantiate a Backend with no implementation');
    }
    this.backupSync = asyncLock();
  }

  async status() {
    const attempts = 3;
    let status: {
      auth: { status: boolean },
      api: { status: boolean, statusPage: string },
    } = {
      auth: { status: true },
      api: { status: true, statusPage: '' },
    };
    for (let i = 1; i <= attempts; i++) {
      status = await this.implementation.status();
      // return on first success
      if (Object.values(status).every(s => s.status === true)) {
        return status;
      } else {
        await new Promise(resolve => setTimeout(resolve, i * 1000));
      }
    }
    return status;
  }

  currentUser() {
    if (this.user) {
      return this.user;
    }
    const stored = this.authStore!.retrieve();
    if (stored && stored.backendName === this.backendName) {
      return Promise.resolve(this.implementation.restoreUser(stored)).then(user => {
        this.user = { ...user, backendName: this.backendName };
        // return confirmed/rehydrated user object instead of stored
        this.authStore!.store(this.user as CmsUser);
        return this.user;
      });
    }
    return Promise.resolve(null);
  }

  isGitBackend() {
    return this.implementation.isGitBackend?.() || false;
  }

  updateUserCredentials = (updatedCredentials: CmsCredentials) => {
    const storedUser = this.authStore!.retrieve();
    if (storedUser && storedUser.backendName === this.backendName) {
      this.user = { ...storedUser, ...updatedCredentials };
      this.authStore!.store(this.user as CmsUser);
      return this.user;
    }
  };

  authComponent() {
    return this.implementation.authComponent();
  }

  authenticate(credentials: CmsCredentials) {
    return this.implementation.authenticate(credentials).then(user => {
      this.user = { ...user, backendName: this.backendName };
      if (this.authStore) {
        this.authStore.store(this.user as CmsUser);
      }
      return this.user;
    });
  }

  async logout() {
    try {
      await this.implementation.logout();
    } catch (e: unknown) {
      console.warn('Error during logout', (e as Error).message);
    } finally {
      this.user = null;
      if (this.authStore) {
        this.authStore.logout();
      }
      // DCMS-1884: local-draft backups (localForage `backup*` entries, backed by
      // `decap-cms:backup*` localStorage keys) are keyed by collection/slug only,
      // not by user. On a shared workstation, leaving them around lets the next
      // person to log in and open an entry get a "Restore backup" prompt that
      // hydrates the previous, still-logged-out user's private draft content.
      await this.purgeAllLocalDraftBackups();
    }
  }

  // DCMS-1884: remove every local-draft backup for every collection/slug, not just
  // the one the current editor session happens to be looking at. Scoped to the
  // `backup`-prefixed localForage keys so unrelated caches (e.g. GitHub API
  // response caches) are left alone.
  async purgeAllLocalDraftBackups() {
    try {
      const keys = await localForage.keys();
      await Promise.all(
        keys
          .filter(key => key === 'backup' || key.startsWith('backup.'))
          .map(key => localForage.removeItem(key)),
      );
    } catch (e: unknown) {
      console.warn('purgeAllLocalDraftBackups', (e as Error).message);
    }
  }

  getToken = () => this.implementation.getToken();

  async entryExist(
    collection: CmsCollectionState,
    path: string,
    slug: string,
    useWorkflow: boolean,
  ) {
    const unpublishedEntry = useWorkflow
      && (await this.implementation
        .unpublishedEntry({ collection: collection.name, slug })
        .catch(error => {
          if (error.name === EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
            return Promise.resolve(false);
          }
          return Promise.reject(error);
        }));

    if (unpublishedEntry) return unpublishedEntry;

    const publishedEntry = await this.implementation
      .getEntry(path, useWorkflow)
      .then(loaded => contentExists(loaded.content))
      .catch(() => false);

    return publishedEntry;
  }

  async generateUniqueSlug(
    collection: CmsCollectionState,
    entryData: Record<string, unknown>,
    config: CmsConfig,
    usedSlugs: string[],
    customPath: string | undefined,
  ) {
    const slugConfig = config.slug;
    let slug: string;
    if (customPath) {
      slug = slugFromCustomPath(collection, customPath);
    } else {
      slug = slugFormatter(collection, entryData, slugConfig);
    }
    let i = 1;
    let uniqueSlug = slug;

    // Check for duplicate slug in loaded entities store first before repo
    while (
      usedSlugs.includes(uniqueSlug)
      || (await this.entryExist(
        collection,
        selectEntryPath(collection, uniqueSlug) as string,
        uniqueSlug,
        selectUseWorkflow(config),
      ))
    ) {
      uniqueSlug = `${slug}${sanitizeChar(' ', slugConfig)}${i++}`;
    }
    return uniqueSlug;
  }

  processEntries(loadedEntries: BackendEntry[], collection: CmsCollectionState) {
    const formattedEntries = loadedEntries.map(({ file, content }) => {
      const slug = selectEntrySlug(collection, file.path) ?? '';
      return createEntry(collection.name, slug, file.path, {
        raw: legacyRaw(content),
        data: entryDataFromContent(collection, file.path, content),
        label: selectFileEntryLabel(collection, slug),
        author: file.author?.name,
        updatedOn: file.updatedOn,
        meta: { path: prepareMetaPath(file.path, collection) },
      });
    });
    // Group i18n entries before filtering them, so the filter is matched
    // against the default locale data of a single, merged entry. Entries of a
    // `single_file` collection keep their data nested under a locale key until
    // they're grouped, so filtering first never matched anything; for
    // `multiple_files`/`multiple_folders` it dropped translations whose file
    // didn't repeat the filter field.
    const groupedEntries = hasI18n(collection)
      ? groupEntries(collection, selectFolderEntryExtension(collection), formattedEntries)
      : formattedEntries;

    // If this collection has a "filter" property, filter entries accordingly
    const collectionFilter = collection.filter;
    return collectionFilter
      ? this.filterEntries({ entries: groupedEntries }, collectionFilter)
      : groupedEntries;
  }

  async listEntries(collection: CmsCollectionState) {
    const extension = selectFolderEntryExtension(collection);
    let listMethod: () => Promise<BackendEntry[]>;
    const collectionType = collection.type;
    if (collectionType === FOLDER) {
      listMethod = () => {
        const depth = collectionDepth(collection);
        return this.implementation.entriesByFolder(collection.folder as string, extension, depth);
      };
    } else if (collectionType === FILES) {
      // Only the path: the entry's label is collection config the engine
      // already has, so it never crosses the seam.
      const files = (collection.files || []).map((collectionFile: CmsCollectionFileState) => ({
        path: collectionFile.file,
      }));
      listMethod = () => this.implementation.entriesByFiles(files);
    } else {
      throw new Error(`Unknown collection type: ${collectionType}`);
    }
    const loadedEntries = await listMethod();
    /*
          Wrap cursors so we can tell which collection the cursor is
          from. This is done to prevent traverseCursor from requiring a
          `collection` argument.
        */

    const cursor = Cursor.create(
      (loadedEntries as CursorCompatibleEntries<BackendEntry>)[
        CURSOR_COMPATIBILITY_SYMBOL
      ],
    ).wrapData({
      cursorType: 'collectionEntries',
      collection,
    });
    return {
      entries: this.processEntries(loadedEntries, collection),
      pagination: cursor.meta?.['page'],
      cursor,
    };
  }

  // The same as listEntries, except that if a cursor with the "next"
  // action available is returned, it calls "next" on the cursor and
  // repeats the process. Once there is no available "next" action, it
  // returns all the collected entries. Used to retrieve all entries
  // for local searches and queries.
  async listAllEntries(collection: CmsCollectionState) {
    if (collection.folder && this.implementation.allEntriesByFolder) {
      const depth = collectionDepth(collection);
      const extension = selectFolderEntryExtension(collection);
      return this.implementation
        .allEntriesByFolder(
          collection.folder as string,
          extension,
          depth,
          collectionRegex(collection),
        )
        .then(entries => this.processEntries(entries, collection));
    }

    const response = await this.listEntries(collection);
    const { entries } = response;
    let { cursor } = response;
    while (cursor && cursor.actions!.has('next')) {
      const { entries: newEntries, cursor: newCursor } = await this.traverseCursor(cursor, 'next');
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries;
  }

  async searchCollectionEntries(
    collection: CmsCollectionState,
    searchFields: string[],
    searchTerm: string,
  ) {
    const collectionEntries = await this.listAllEntries(collection);
    const { clauses, freeText } = parseSearchTerm(searchTerm);
    const matchingEntries = collectionEntries.filter(entry => matchesSearchClauses(entry, searchFields, clauses));
    if (!freeText) {
      return matchingEntries.map((original, index) => ({ original, score: 100, index }));
    }
    const fuzzyResults = fuzzyFilter(freeText, matchingEntries, extractSearchFields(searchFields));
    if (clauses.length > 0) {
      // Field clauses have already narrowed the candidate set, so the noise
      // guard below would only serve to silently drop legitimate short
      // free-text matches (e.g. `title:post 20`). Once clauses are present,
      // the fuzzy score is a rank-only signal rather than a relevance gate.
      return fuzzyResults;
    }
    return fuzzyResults.filter(({ score }) => score > 5);
  }

  async search(collections: CmsCollectionState[], searchTerm: string) {
    // Perform a local search by requesting all entries. For each
    // collection, load it, search, and call onCollectionResults with
    // its results.
    const errors: Error[] = [];
    const collectionEntriesRequests = collections
      .map(collection => {
        const searchFields = getCollectionSearchFields(collection);
        return this.searchCollectionEntries(collection, searchFields, searchTerm);
      })
      .map(p =>
        p.catch(err => {
          errors.push(err);
          return [] as FuzzyFilterResult<EntryValue>[];
        })
      );

    const entries = await Promise.all(collectionEntriesRequests).then(arrays => flatten(arrays));

    if (errors.length > 0) {
      throw new LocalSearchError(
        `Errors occurred while searching entries locally! Errors: ${
          errors
            .map(err => err.message)
            .join(', ')
        }`,
        errors,
      );
    }

    // Score-based noise filtering already happened per collection in
    // searchCollectionEntries, where clause presence is known; this stage
    // only ranks the combined results.
    const hits = entries
      .sort(sortByScore)
      .map((f: FuzzyFilterResult<EntryValue>) => f.original);
    return { entries: hits };
  }

  async query(
    collection: CmsCollectionState,
    searchFields: string[],
    searchTerm: string,
    file?: string,
    limit?: number,
  ) {
    let entries = await this.listAllEntries(collection);
    if (file) {
      entries = entries.filter(e => e.slug === file);
    }

    const expandedEntries = expandSearchEntries(entries, searchFields);

    let hits = fuzzyFilter(searchTerm, expandedEntries, entry => getEntryField(entry.field, entry))
      .sort(sortByScore)
      .map(f => f.original);

    if (limit !== undefined && limit > 0) {
      hits = hits.slice(0, limit);
    }

    const merged = mergeExpandedEntries(hits);
    return { query: searchTerm, hits: merged };
  }

  traverseCursor(cursor: Cursor, action: string) {
    const [data, unwrappedCursor] = cursor.unwrapData();
    if (!isCollectionEntriesCursorData(data)) {
      throw new Error(
        `traverseCursor: expected a "collectionEntries" cursor, but received cursor data with cursorType "${
          String(
            data['cursorType'],
          )
        }"`,
      );
    }
    const { collection } = data;
    return this.implementation!.traverseCursor!(unwrappedCursor, action).then(
      async ({ entries, cursor: newCursor }) => ({
        entries: this.processEntries(entries, collection),
        cursor: Cursor.create(newCursor).wrapData({
          cursorType: 'collectionEntries',
          collection,
        }),
      }),
    );
  }

  async getLocalDraftBackup(collection: CmsCollectionState, slug: string) {
    const key = getEntryBackupKey(collection.name, slug);
    const backup = await localForage.getItem<BackupEntry>(key);
    if (!backup || !backup.raw.trim()) {
      return {};
    }
    const { raw, path } = backup;
    let { mediaFiles = [] } = backup;

    mediaFiles = mediaFiles.map(file => {
      // de-serialize the file object
      if (file.file) {
        const restoredFile = restoreBackupFile(file.file);
        if (!restoredFile) {
          // Corrupted/legacy entry: the persisted `file` is neither our serialized
          // descriptor nor a real Blob (e.g. a `File` that round-tripped through
          // `JSON.stringify`/`JSON.parse` and lost its bytes). Drop it instead of
          // throwing from `URL.createObjectURL`.
          console.warn(
            `Local draft backup media file "${file.name}" could not be restored and will be skipped.`,
          );
          return { ...file, file: undefined };
        }
        return { ...file, file: restoredFile as File, url: URL.createObjectURL(restoredFile) };
      }
      return file;
    });

    const label = selectFileEntryLabel(collection, slug);

    const formatRawData = (raw: string) => {
      const metaPath = prepareMetaPath(path, collection);
      return createEntry(collection.name, slug, path, {
        raw,
        data: entryDataFromContent(collection, path, rawContent(raw)),
        label,
        mediaFiles,
        meta: metaPath ? { path: metaPath } : {},
      });
    };

    const entry: EntryValue = formatRawData(raw);
    if (hasI18n(collection) && backup.i18n) {
      const i18n = formatI18nBackup(backup.i18n, formatRawData);
      entry.i18n = i18n;
    }

    return { entry };
  }

  async persistLocalDraftBackup(entry: CmsEntry, collection: CmsCollectionState) {
    try {
      await this.backupSync.acquire();
      const key = getEntryBackupKey(collection.name, entry.slug);
      const raw = this.entryToRaw(collection, entry);

      if (!raw.trim()) {
        return;
      }

      const mediaFiles = await Promise.all<MediaFile>(
        (entry.mediaFiles as MediaFile[]).map(async (file: MediaFile) => {
          // make sure to serialize the file
          if (file.url?.startsWith('blob:')) {
            const blob = await fetch(file.url as string).then(res => res.blob());
            const fileObj = blobToFileObj(file.name, blob);
            // `localForage` here may be the `localStorage` + `JSON.stringify` shim, which
            // can't persist `File`/`Blob` bytes directly (see `restoreBackupFile` above).
            const serialized = await serializeFileForBackup(fileObj);
            return { ...file, file: serialized as unknown as File };
          }
          return file;
        }),
      );

      let i18n;
      if (hasI18n(collection)) {
        i18n = getI18nBackup(collection, entry, entry => this.entryToRaw(collection, entry));
      }

      await localForage.setItem<BackupEntry>(key, {
        raw,
        path: entry.path,
        mediaFiles,
        ...(i18n && { i18n }),
      });
      const result = await localForage.setItem(getEntryBackupKey(), raw);
      return result;
    } catch (e: unknown) {
      // A failed local draft backup means the user's in-progress edits are not
      // safely persisted to IndexedDB; this is a data-safety event, not a
      // debug curiosity, so it must not be silently swallowed.
      console.error('persistLocalDraftBackup', e);
      throw e;
    } finally {
      this.backupSync.release();
    }
  }

  async deleteLocalDraftBackup(collection: CmsCollectionState, slug: string) {
    try {
      await this.backupSync.acquire();
      await localForage.removeItem(getEntryBackupKey(collection.name, slug));
      // delete new entry backup if not deleted
      if (slug) await localForage.removeItem(getEntryBackupKey(collection.name));
      const result = await this.deleteAnonymousBackup();
      return result;
    } catch (e: unknown) {
      console.warn('deleteLocalDraftBackup', e);
    } finally {
      this.backupSync.release();
    }
  }

  // Unnamed backup for use in the global error boundary, should always be
  // deleted on cms load.
  deleteAnonymousBackup() {
    return localForage.removeItem(getEntryBackupKey());
  }

  async getEntry(state: State, collection: CmsCollectionState, slug: string) {
    const path = selectEntryPath(collection, slug);
    if (!path) {
      throw new Error(`Entry not found: ${collection.name}/${slug}`);
    }
    const label = selectFileEntryLabel(collection, slug);
    const extension = selectFolderEntryExtension(collection);

    const getEntryValue = async (path: string) => {
      const { file, content } = await this.implementation.getEntry(path);
      const entry = createEntry(collection.name, slug, file.path, {
        raw: legacyRaw(content),
        data: entryDataFromContent(collection, file.path, content),
        label,
        mediaFiles: [],
        meta: { path: prepareMetaPath(file.path, collection) },
      });

      return this.processEntry(state, collection, entry);
    };

    let entryValue: CompleteEntryValue;
    if (hasI18n(collection)) {
      entryValue = await getI18nEntry(collection, extension, path, slug, getEntryValue);
    } else {
      entryValue = await getEntryValue(path);
    }

    return entryValue;
  }

  getMedia(folder?: string, folderSupport?: boolean) {
    return this.implementation.getMedia(folder, folderSupport);
  }

  /**
   * True when the backend implements the paginated media surface
   * (`getMediaPage` + `getMediaCapabilities`); the media library then loads
   * pages on demand instead of the entire library via `getMedia()`.
   */
  supportsMediaPagination(): boolean {
    return Boolean(this.implementation.getMediaPage && this.implementation.getMediaCapabilities);
  }

  getMediaCapabilities() {
    if (!this.implementation.getMediaCapabilities) {
      return Promise.resolve({ pagination: false, dynamicSearch: false });
    }
    return this.implementation.getMediaCapabilities();
  }

  getMediaPage(opts: CmsGetMediaPageOptions) {
    if (!this.implementation.getMediaPage) {
      return Promise.reject(new Error('getMediaPage is not implemented by the current backend'));
    }
    return this.implementation.getMediaPage(opts);
  }

  getMediaFile(path: string) {
    return this.implementation.getMediaFile(path);
  }

  getMediaDisplayURL(displayURL: CmsDisplayURL) {
    if (this.implementation.getMediaDisplayURL) {
      return this.implementation.getMediaDisplayURL(displayURL);
    }
    const err = new Error(
      'getMediaDisplayURL is not implemented by the current backend, but the backend returned a displayURL which was not a string!',
    ) as Error & { displayURL: CmsDisplayURL };
    err.displayURL = displayURL;
    return Promise.reject(err);
  }

  async processUnpublishedEntry(
    collection: CmsCollectionState,
    entryData: UnpublishedEntry,
    withMediaFiles: boolean,
  ) {
    const { slug } = entryData;
    let extension: string;
    if (collection.type === FILES) {
      const file = (collection.files || []).find((f: CmsCollectionFileState) => f.name === slug);
      extension = extname(file?.file ?? '');
    } else {
      extension = selectFolderEntryExtension(collection);
    }

    const mediaFiles: MediaFile[] = [];
    if (withMediaFiles) {
      const nonDataFiles = entryData.diffs.filter(d => !d.path.endsWith(extension));
      const files = await Promise.all(
        nonDataFiles.map(f => this.implementation!.unpublishedEntryMediaFile(collection.name, slug, f.path, f.id)),
      );
      mediaFiles.push(...files.map(f => ({ ...f, draft: true })));
    }

    const dataFiles = sortBy(
      entryData.diffs.filter(d => d.path.endsWith(extension)),
      f => f.path.length,
    );

    const formatData = (content: BackendEntryContent, path: string, newFile: boolean) => {
      return createEntry(collection.name, slug, path, {
        raw: legacyRaw(content),
        data: entryDataFromContent(collection, path, content),
        isModification: !newFile,
        label: collection && selectFileEntryLabel(collection, slug),
        mediaFiles,
        updatedOn: entryData.updatedAt,
        author: entryData.author?.name,
        status: entryData.status,
        meta: { path: prepareMetaPath(path, collection) },
      });
    };

    const readAndFormatDataFile = async (dataFile: UnpublishedEntryDiff) => {
      const data = await this.implementation.unpublishedEntryDataFile(
        collection.name,
        entryData.slug,
        dataFile.path,
        dataFile.id,
      );
      const entryWithFormat = formatData(rawContent(data), dataFile.path, dataFile.newFile);
      return entryWithFormat;
    };

    // if the unpublished entry has no diffs, return the original
    if (dataFiles.length <= 0) {
      const { file, content } = await this.implementation.getEntry(
        selectEntryPath(collection, slug) as string,
      );
      return formatData(content, file.path, false);
    } else if (hasI18n(collection)) {
      // we need to read all locales files and not just the changes
      const path = selectEntryPath(collection, slug) as string;
      const i18nFiles = getI18nDataFiles(collection, extension, path, slug, dataFiles);
      let entries = await Promise.all(
        i18nFiles.map(dataFile => readAndFormatDataFile(dataFile).catch(() => null)),
      );
      entries = entries.filter(Boolean);
      const grouped = groupEntries(collection, extension, entries.filter(entry => entry !== null));
      return grouped[0];
    } else {
      const entryWithFormat = await readAndFormatDataFile(dataFiles[0]);
      return entryWithFormat;
    }
  }

  // -- Editor notes (decaporg #7563) ------------------------------------------

  /** Whether the backend implements editor notes at all. */
  supportsNotes() {
    return typeof this.implementation.getNotes === 'function';
  }

  async getNotes(collection: string, slug: string): Promise<Note[]> {
    if (typeof this.implementation.getNotes === 'function') {
      return this.implementation.getNotes(collection, slug);
    }
    console.warn(`Backend '${this.backendName}' does not support notes`);
    return [];
  }

  async addNote(collection: string, slug: string, note: Omit<Note, 'id'>, entryTitle?: string): Promise<Note> {
    if (typeof this.implementation.addNote === 'function') {
      return this.implementation.addNote(collection, slug, note, entryTitle);
    }
    throw new Error(`Backend '${this.backendName}' does not support adding notes`);
  }

  async updateNote(collection: string, slug: string, noteId: string, updates: Partial<Note>): Promise<Note> {
    if (typeof this.implementation.updateNote === 'function') {
      return this.implementation.updateNote(collection, slug, noteId, updates);
    }
    throw new Error(`Backend '${this.backendName}' does not support updating notes`);
  }

  async deleteNote(collection: string, slug: string, noteId: string): Promise<void> {
    if (typeof this.implementation.deleteNote === 'function') {
      return this.implementation.deleteNote(collection, slug, noteId);
    }
    throw new Error(`Backend '${this.backendName}' does not support deleting notes`);
  }

  async toggleNoteResolution(collection: string, slug: string, noteId: string): Promise<Note> {
    if (typeof this.implementation.toggleNoteResolution === 'function') {
      return this.implementation.toggleNoteResolution(collection, slug, noteId);
    }
    throw new Error(`Backend '${this.backendName}' does not support resolving notes`);
  }

  /** Whether the backend can keep notes current while an entry is open. */
  supportsNotesPolling() {
    return typeof this.implementation.startNotesPolling === 'function';
  }

  async startNotesPolling(collection: string, slug: string, callbacks: NotesWatchCallbacks): Promise<void> {
    return this.implementation.startNotesPolling?.(collection, slug, callbacks);
  }

  async stopNotesPolling(collection: string, slug: string): Promise<void> {
    return this.implementation.stopNotesPolling?.(collection, slug);
  }

  async refreshNotesNow(collection: string, slug: string): Promise<void> {
    return this.implementation.refreshNotesNow?.(collection, slug);
  }

  /**
   * Every slug a collection already holds: published entries, the slugs the
   * caller already knows about and, with the editorial workflow, unpublished
   * entries. Used to enforce a collection's `limit`.
   */
  async entrySlugsForCollectionLimit(
    collection: CmsCollectionState,
    config: CmsConfig,
    usedSlugs: string[] = [],
  ): Promise<Set<string>> {
    const publishedEntries = await this.listAllEntries(collection);
    const slugs = new Set<string>([...publishedEntries.map(entry => entry.slug), ...usedSlugs]);

    if (selectUseWorkflow(config) && this.implementation.unpublishedEntries) {
      const ids = await this.implementation.unpublishedEntries();
      const unpublishedEntries = await Promise.all(
        ids.map(id => this.implementation.unpublishedEntry({ id })),
      );
      for (const entry of unpublishedEntries) {
        if (entry.collection === collection.name) {
          slugs.add(entry.slug);
        }
      }
    }

    return slugs;
  }

  async unpublishedEntries(collections: CmsCollectionState[]) {
    const ids = await this.implementation.unpublishedEntries!();
    const entries = (
      await Promise.all(
        ids.map(async id => {
          const entryData = await this.implementation.unpublishedEntry({ id });
          const collectionName = entryData.collection;
          const collection = collections.find((c: CmsCollectionState) => c.name === collectionName);
          if (!collection) {
            console.warn(`Missing collection '${collectionName}' for unpublished entry '${id}'`);
            return null;
          }
          const entry = await this.processUnpublishedEntry(collection, entryData, false);
          return entry;
        }),
      )
    ).filter(Boolean) as EntryValue[];

    return { pagination: 0, entries };
  }

  supportsContentSync() {
    return typeof this.implementation.getSyncToken === 'function';
  }

  supportsChangeFeed() {
    return typeof this.implementation.getChanges === 'function';
  }

  async getSyncToken() {
    if (!this.implementation.getSyncToken) return null;
    return this.implementation.getSyncToken();
  }

  async getChanges(since: string) {
    if (!this.implementation.getChanges) return null;
    return this.implementation.getChanges(since);
  }

  /**
   * Advisory entry-locking surface (optional). See the `BackendImplementation`
   * lock methods for the contract; this class only feature-detects and
   * forwards, so backends without lock support (the default) leave every
   * one of these inert and the editor never surfaces lock UI for them.
   */
  supportsEntryLocking() {
    return typeof this.implementation.acquireEntryLock === 'function';
  }

  async getEntryLock(path: string): Promise<CmsEntryLock | null> {
    if (!this.implementation.getEntryLock) return null;
    return this.implementation.getEntryLock(path);
  }

  async acquireEntryLock(
    path: string,
    owner: CmsEntryLockOwner,
    force = false,
  ): Promise<CmsEntryLock | null> {
    if (!this.implementation.acquireEntryLock) return null;
    return this.implementation.acquireEntryLock(path, owner, { force });
  }

  async releaseEntryLock(path: string, owner: CmsEntryLockOwner): Promise<void> {
    if (!this.implementation.releaseEntryLock) return;
    return this.implementation.releaseEntryLock(path, owner);
  }

  async refreshEntryLock(path: string, owner: CmsEntryLockOwner): Promise<CmsEntryLock | null> {
    if (!this.implementation.refreshEntryLock) return null;
    return this.implementation.refreshEntryLock(path, owner);
  }

  // Generic so it hands back the same entry variant it was given: attaching
  // media files says nothing about whether the entry was fully loaded.
  async processEntry<T extends EntryValue>(
    state: State,
    collection: CmsCollectionState,
    entry: T,
  ): Promise<T> {
    const integration = selectIntegration(state.integrations as any, null, 'assetStore');
    const mediaFolders = selectMediaFolders(state.config, collection, entry);
    if (mediaFolders.length > 0 && !integration) {
      // Media folder listings are shared between every entry load that resolves the
      // same folder; without the coordinator each opened entry re-lists its folders.
      const files = await Promise.all(
        mediaFolders.map(folder =>
          queryCore.fetch(
            `media-folder/${folder}`,
            () => this.implementation.getMedia(folder),
            { tags: [MEDIA_TAG], keepValue: true },
          )
        ),
      );
      entry.mediaFiles = entry.mediaFiles.concat(...files);
    } else {
      entry.mediaFiles = entry.mediaFiles.concat((state.mediaLibrary.files || []) as MediaFile[]);
    }

    return entry;
  }

  async unpublishedEntry(state: State, collection: CmsCollectionState, slug: string) {
    const entryData = await this.implementation!.unpublishedEntry!({
      collection: collection.name as string,
      slug,
    });

    let entry = await this.processUnpublishedEntry(collection, entryData, true);
    entry = await this.processEntry(state, collection, entry);
    return entry;
  }

  /**
   * Creates a URL using `site_url` from the config and `preview_path` from the
   * entry's collection. Does not currently make a request through the backend,
   * but likely will in the future.
   */
  getDeploy(collection: CmsCollectionState, slug: string, entry: CmsEntry) {
    /**
     * If `site_url` is undefined or `show_preview_links` in the config is set to false, do nothing.
     */

    const baseUrl = this.config.site_url;

    if (!baseUrl || this.config.show_preview_links === false) {
      return;
    }

    return {
      url: previewUrlFormatter(baseUrl, collection, slug, entry, this.config.slug),
      status: 'SUCCESS',
    };
  }

  /**
   * Requests a base URL from the backend for previewing a specific entry.
   * Supports polling via `maxAttempts` and `interval` options, as there is
   * often a delay before a preview URL is available.
   */
  async getDeployPreview(
    collection: CmsCollectionState,
    slug: string,
    entry: CmsEntry,
    {
      maxAttempts = 1,
      interval = 5000,
      signal,
    }: { maxAttempts?: number, interval?: number, signal?: AbortSignal } = {},
  ) {
    /**
     * If the registered backend does not provide a `getDeployPreview` method, or
     * `show_preview_links` in the config is set to false, do nothing.
     */
    if (!this.implementation.getDeployPreview || this.config.show_preview_links === false) {
      return;
    }

    /**
     * Poll for the deploy preview URL (defaults to 1 attempt, so no polling by
     * default).
     */
    let deployPreview,
      count = 0;
    while (!deployPreview && count < maxAttempts) {
      if (signal?.aborted) {
        return;
      }
      count++;
      deployPreview = await this.implementation.getDeployPreview(collection.name, slug);
      if (!deployPreview) {
        await new Promise(resolve => setTimeout(() => resolve(undefined), interval));
      }
    }

    /**
     * If there's no deploy preview, do nothing.
     */
    if (!deployPreview) {
      return;
    }

    return {
      /**
       * Create a URL using the collection `preview_path`, if provided.
       */
      url: previewUrlFormatter(deployPreview.url, collection, slug, entry, this.config.slug),
      /**
       * Always capitalize the status for consistency.
       */
      status: deployPreview.status ? deployPreview.status.toUpperCase() : '',
    };
  }

  async persistEntry({
    config,
    collection,
    entryDraft: draft,
    assetProxies,
    usedSlugs,
    unpublished = false,
    status,
  }: PersistArgs) {
    const updatedEntity = await this.invokePreSaveEvent(draft.entry);

    let entryDraft: EntryDraft;
    if ((updatedEntity as any)?.data === undefined) {
      entryDraft = updatedEntity
        ? { ...draft, entry: { ...draft.entry, data: updatedEntity } }
        : draft;
    } else {
      entryDraft = updatedEntity ? { ...draft, entry: updatedEntity as CmsEntry } : draft;
    }

    const newEntry = entryDraft.entry?.newRecord || false;

    const useWorkflow = selectUseWorkflow(config);

    const customPath = selectCustomPath(collection, entryDraft);

    let dataFile: CmsDataFile;
    if (newEntry) {
      if (!selectAllowNewEntries(collection)) {
        throw new Error('Not allowed to create new entries in this collection');
      }
      const limit = collection.limit;
      if (
        collection.type === FOLDER
        && limit !== undefined
        && limit !== null
        && (await this.entrySlugsForCollectionLimit(collection, config, usedSlugs)).size >= limit
      ) {
        throw new Error(`Entry limit of ${limit} reached for collection ${collection.name}`);
      }
      const slug = await this.generateUniqueSlug(
        collection,
        entryDraft.entry?.data as Record<string, unknown>,
        config,
        usedSlugs,
        customPath,
      );
      const path = customPath || (selectEntryPath(collection, slug) as string);
      dataFile = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.entry),
      };

      updateAssetProxies(assetProxies, config, collection, entryDraft, path);
    } else {
      const slug = entryDraft.entry?.slug;
      const path = entryDraft.entry?.path;
      dataFile = {
        path,
        // for workflow entries we refresh the slug on publish
        slug: customPath && !useWorkflow ? slugFromCustomPath(collection, customPath) : slug,
        raw: this.entryToRaw(collection, entryDraft.entry),
        newPath: customPath === path ? undefined : customPath,
      };
    }

    const { slug, path, newPath } = dataFile;

    let dataFiles = [dataFile];
    if (hasI18n(collection)) {
      const extension = selectFolderEntryExtension(collection);
      dataFiles = getI18nFiles(
        collection,
        extension,
        entryDraft.entry,
        (draftData: CmsEntry) => this.entryToRaw(collection, draftData),
        path,
        slug,
        newPath,
      );
    }

    const user = (await this.currentUser()) as CmsUser;
    const commitMessage = commitMessageFormatter(
      newEntry ? 'create' : 'update',
      config,
      {
        collection,
        slug,
        path,
        authorLogin: user.login,
        authorName: user.name,
        authorEmail: user.email,
      },
      user.useOpenAuthoring,
    );

    const collectionName = collection.name;
    const hasSubfolders = collection.nested?.subfolders !== false;

    const updatedOptions = { unpublished, status };
    const opts = {
      newEntry,
      commitMessage,
      collectionName,
      useWorkflow,
      hasSubfolders,
      ...updatedOptions,
    };

    if (!useWorkflow) {
      await this.invokePrePublishEvent(entryDraft.entry);
    }

    await this.implementation.persistEntry(
      {
        dataFiles,
        assets: assetProxies,
      },
      opts,
    );

    if (assetProxies?.length) {
      queryCore.invalidateTags([MEDIA_TAG]);
    }

    await this.invokePostSaveEvent(entryDraft.entry);

    if (!useWorkflow) {
      await this.invokePostPublishEvent(entryDraft.entry);
    }

    return slug;
  }

  async invokeEventWithEntry(event: string, entry: CmsEntry) {
    const { login, name } = (await this.currentUser()) as CmsUser;
    return await invokeEvent({ name: event, data: { entry, author: { login, name } } });
  }

  async invokePrePublishEvent(entry: CmsEntry) {
    await this.invokeEventWithEntry('prePublish', entry);
  }

  async invokePostPublishEvent(entry: CmsEntry) {
    await this.invokeEventWithEntry('postPublish', entry);
  }

  async invokePreUnpublishEvent(entry: CmsEntry) {
    await this.invokeEventWithEntry('preUnpublish', entry);
  }

  async invokePostUnpublishEvent(entry: CmsEntry) {
    await this.invokeEventWithEntry('postUnpublish', entry);
  }

  async invokePreSaveEvent(entry: CmsEntry) {
    return await this.invokeEventWithEntry('preSave', entry);
  }

  async invokePostSaveEvent(entry: CmsEntry) {
    await this.invokeEventWithEntry('postSave', entry);
  }

  async persistMedia(config: CmsConfig, file: AssetProxy) {
    const user = (await this.currentUser()) as CmsUser;
    const options = {
      commitMessage: commitMessageFormatter(
        'uploadMedia',
        config,
        {
          path: file.path,
          authorLogin: user.login,
          authorName: user.name,
          authorEmail: user.email,
        },
        user.useOpenAuthoring,
      ),
    };
    const persisted = await this.implementation.persistMedia(file, options);
    queryCore.invalidateTags([MEDIA_TAG]);
    return persisted;
  }

  async deleteEntry(state: State, collection: CmsCollectionState, slug: string) {
    const config = state.config;
    const path = selectEntryPath(collection, slug) as string;
    const extension = selectFolderEntryExtension(collection) as string;

    if (!selectAllowDeletion(collection)) {
      throw new Error('Not allowed to delete entries in this collection');
    }

    const user = (await this.currentUser()) as CmsUser;
    const commitMessage = commitMessageFormatter(
      'delete',
      config,
      {
        collection,
        slug,
        path,
        authorLogin: user.login,
        authorName: user.name,
        authorEmail: user.email,
      },
      user.useOpenAuthoring,
    );

    const entry = selectEntry(state.entries as any, collection.name, slug) as CmsEntry;
    await this.invokePreUnpublishEvent(entry);
    let paths = [path];
    if (hasI18n(collection)) {
      paths = getFilePaths(collection, extension, path, slug);
    }
    await this.implementation.deleteFiles(paths, commitMessage);

    await this.invokePostUnpublishEvent(entry);
  }

  async deleteMedia(config: CmsConfig, path: string) {
    const user = (await this.currentUser()) as CmsUser;
    const commitMessage = commitMessageFormatter(
      'deleteMedia',
      config,
      {
        path,
        authorLogin: user.login,
        authorName: user.name,
        authorEmail: user.email,
      },
      user.useOpenAuthoring,
    );
    await this.implementation.deleteFiles([path], commitMessage);
    queryCore.invalidateTags([MEDIA_TAG]);
  }

  persistUnpublishedEntry(args: PersistArgs) {
    return this.persistEntry({ ...args, unpublished: true });
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    return this.implementation.updateUnpublishedEntryStatus!(collection, slug, newStatus);
  }

  async publishUnpublishedEntry(entry: CmsEntry) {
    const collection = entry.collection;
    const slug = entry.slug;

    await this.invokePrePublishEvent(entry);
    await this.implementation.publishUnpublishedEntry!(collection, slug);
    await this.invokePostPublishEvent(entry);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    return this.implementation.deleteUnpublishedEntry!(collection, slug);
  }

  entryToRaw(collection: CmsCollectionState, entry: CmsEntry): string {
    const format = resolveFormat(collection, entry);
    const fieldsOrder = this.fieldsOrder(collection, entry);
    const fieldsComments = selectFieldsComments(collection, entry);
    let content = format.toFile(entry.data as object, fieldsOrder, fieldsComments);
    if (content.slice(-1) != '\n') {
      // add the EOL if it does not exist.
      content += '\n';
    }
    return content;
  }

  fieldsOrder(collection: CmsCollectionState, entry: CmsEntry) {
    const fields = collection.fields;
    if (fields) {
      return fields.map((f: CmsEntryField) => f.name);
    }

    const files = collection.files;
    const file = (files || ([] as CmsCollectionFileState[])).filter(
      (f: CmsCollectionFileState) => f.name === entry.slug,
    )[0];

    if (file == null) {
      throw new Error(`No file found for ${entry.slug} in ${collection.name}`);
    }
    return (file.fields || []).map((f: CmsEntryField) => f.name);
  }

  filterEntries<T extends EntryValue>(collection: { entries: T[] }, filterRule: CmsFilterRule) {
    return collection.entries.filter(entry => {
      const fieldValue = entry.data[filterRule.field];
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(filterRule.value);
      }
      return fieldValue === filterRule.value;
    });
  }
}

export function resolveBackend(config: CmsConfig) {
  if (!config.backend.name) {
    throw new Error('No backend defined in configuration');
  }

  const { name } = config.backend;
  const authStore = new LocalStorageAuthStore();

  const backend = getBackend(name);
  if (!backend) {
    const hint = ' Make sure the backend is registered with CMS.registerBackend() before'
      + ' the CMS initialises.';
    throw new Error(`Backend not found: ${name}.${hint}`);
  } else {
    // `getBackend` returns a registry entry with only `init`; the rest of
    // `Implementation` is supplied by the value `init` returns at runtime,
    // which the Backend instance only needs after `authenticate()`.
    return new Backend(backend as unknown as Implementation, {
      backendName: name,
      authStore,
      config,
    });
  }
}

export const currentBackend = (function() {
  let backend: Backend;

  return (config: CmsConfig) => {
    if (backend) {
      return backend;
    }

    return (backend = resolveBackend(config));
  };
})();
