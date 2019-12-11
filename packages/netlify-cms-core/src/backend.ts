import { attempt, flatten, isError, trimStart, trimEnd, flow, partialRight, uniq } from 'lodash';
import { List } from 'immutable';
import { stripIndent } from 'common-tags';
import * as fuzzy from 'fuzzy';
import { resolveFormat } from './formats/formats';
import { selectMediaFilePath, selectMediaFolder } from './reducers/entries';
import { selectIntegration } from './reducers/integrations';
import {
  selectListMethod,
  selectEntrySlug,
  selectEntryPath,
  selectFileEntryLabel,
  selectAllowNewEntries,
  selectAllowDeletion,
  selectFolderEntryExtension,
  selectInferedField,
} from './reducers/collections';
import { createEntry, EntryValue } from './valueObjects/Entry';
import { sanitizeSlug, sanitizeChar } from './lib/urlHelper';
import { getBackend } from './lib/registry';
import { commitMessageFormatter, slugFormatter, prepareSlug } from './lib/backendHelper';
import {
  localForage,
  Cursor,
  CURSOR_COMPATIBILITY_SYMBOL,
  EditorialWorkflowError,
} from 'netlify-cms-lib-util';
import { EDITORIAL_WORKFLOW, status } from './constants/publishModes';
import {
  SLUG_MISSING_REQUIRED_DATE,
  compileStringTemplate,
  extractTemplateVars,
  parseDateFromEntry,
  dateParsers,
} from './lib/stringTemplate';
import {
  Collection,
  EntryMap,
  Config,
  SlugConfig,
  DisplayURL,
  FilterRule,
  Collections,
  MediaFile,
  Integrations,
  EntryDraft,
  CollectionFile,
  State,
} from './types/redux';
import AssetProxy from './valueObjects/AssetProxy';
import { selectEditingWorkflowDraft } from './reducers/editorialWorkflow';

export class LocalStorageAuthStore {
  storageKey = 'netlify-cms-user';

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

const extractSearchFields = (searchFields: string[]) => (entry: EntryValue) =>
  searchFields.reduce((acc, field) => {
    const nestedFields = field.split('.');
    let f = entry.data;
    for (let i = 0; i < nestedFields.length; i++) {
      f = f[nestedFields[i]];
      if (!f) break;
    }
    return f ? `${acc} ${f}` : acc;
  }, '');

const sortByScore = (a: fuzzy.FilterResult<EntryValue>, b: fuzzy.FilterResult<EntryValue>) => {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
};

function createPreviewUrl(
  baseUrl: string,
  collection: Collection,
  slug: string,
  slugConfig: SlugConfig,
  entry: EntryMap,
) {
  /**
   * Preview URL can't be created without `baseUrl`. This makes preview URLs
   * optional for backends that don't support them.
   */
  if (!baseUrl) {
    return;
  }

  /**
   * Without a `previewPath` for the collection (via config), the preview URL
   * will be the URL provided by the backend.
   */
  if (!collection.get('preview_path')) {
    return baseUrl;
  }

  /**
   * If a `previewPath` is provided for the collection, use it to construct the
   * URL path.
   */
  const basePath = trimEnd(baseUrl, '/');
  const pathTemplate = collection.get('preview_path') as string;
  const fields = entry.get('data');
  const date = parseDateFromEntry(entry, collection, collection.get('preview_path_date_field'));

  // Prepare and sanitize slug variables only, leave the rest of the
  // `preview_path` template as is.
  const processSegment = flow([
    value => String(value),
    prepareSlug,
    partialRight(sanitizeSlug, slugConfig),
  ]);
  let compiledPath;

  try {
    compiledPath = compileStringTemplate(pathTemplate, date, slug, fields, processSegment);
  } catch (err) {
    // Print an error and ignore `preview_path` if both:
    //   1. Date is invalid (according to Moment), and
    //   2. A date expression (eg. `{{year}}`) is used in `preview_path`
    if (err.name === SLUG_MISSING_REQUIRED_DATE) {
      console.error(stripIndent`
        Collection "${collection.get('name')}" configuration error:
          \`preview_path_date_field\` must be a field with a valid date. Ignoring \`preview_path\`.
      `);
      return basePath;
    }
    throw err;
  }

  const previewPath = trimStart(compiledPath, ' /');
  return `${basePath}/${previewPath}`;
}

interface ImplementationInitOptions {
  useWorkflow: boolean;
  updateUserCredentials: (credentials: Credentials) => void;
  initialWorkflowStatus: string;
}

interface ImplementationEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  file: { path: string; label: string };
  metaData: { collection: string };
  isModification?: boolean;
  slug: string;
  mediaFiles: MediaFile[];
}

interface Implementation {
  authComponent: () => void;
  restoreUser: (user: User) => Promise<User>;
  init: (config: Config, options: ImplementationInitOptions) => Implementation;
  authenticate: (credentials: Credentials) => Promise<User>;
  logout: () => Promise<void>;
  getToken: () => Promise<string>;
  unpublishedEntry?: (collection: Collection, slug: string) => Promise<ImplementationEntry>;
  getEntry: (collection: Collection, slug: string, path: string) => Promise<ImplementationEntry>;
  allEntriesByFolder?: (
    collection: Collection,
    extension: string,
  ) => Promise<ImplementationEntry[]>;
  traverseCursor: (
    cursor: typeof Cursor,
    action: unknown,
  ) => Promise<{ entries: ImplementationEntry[]; cursor: typeof Cursor }>;
  entriesByFolder: (collection: Collection, extension: string) => Promise<ImplementationEntry[]>;
  entriesByFiles: (collection: Collection, extension: string) => Promise<ImplementationEntry[]>;
  unpublishedEntries: () => Promise<ImplementationEntry[]>;
  getMediaDisplayURL?: (displayURL: DisplayURL) => Promise<string>;
  getMedia: (folder?: string) => Promise<MediaFile[]>;
  getMediaFile: (path: string) => Promise<MediaFile>;
  getDeployPreview: (
    collection: Collection,
    slug: string,
  ) => Promise<{ url: string; status: string }>;

  persistEntry: (
    obj: { path: string; slug: string; raw: string },
    assetProxies: AssetProxy[],
    opts: {
      newEntry: boolean;
      parsedData: { title: string; description: string };
      commitMessage: string;
      collectionName: string;
      useWorkflow: boolean;
      unpublished: boolean;
      hasAssetStore: boolean;
      status?: string;
    },
  ) => Promise<void>;
  persistMedia: (file: AssetProxy, opts: { commitMessage: string }) => Promise<MediaFile>;
  deleteFile: (
    path: string,
    commitMessage: string,
    opts?: { collection: Collection; slug: string },
  ) => Promise<void>;
  updateUnpublishedEntryStatus: (
    collection: string,
    slug: string,
    newStatus: string,
  ) => Promise<void>;
  publishUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  deleteUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
}

type Credentials = {};

interface User {
  backendName: string;
  login: string;
  name: string;
  useOpenAuthoring: boolean;
}

interface AuthStore {
  retrieve: () => User;
  store: (user: User) => void;
  logout: () => void;
}

interface BackendOptions {
  backendName?: string;
  authStore?: AuthStore | null;
  config?: Config;
}

interface BackupMediaFile extends MediaFile {
  file?: File;
}

export interface ImplementationMediaFile extends MediaFile {
  file?: File;
}

interface BackupEntry {
  raw: string;
  path: string;
  mediaFiles: BackupMediaFile[];
}

interface PersistArgs {
  config: Config;
  collection: Collection;
  entryDraft: EntryDraft;
  assetProxies: AssetProxy[];
  integrations: Integrations;
  usedSlugs: List<string>;
  unpublished?: boolean;
  status?: string;
}

export class Backend {
  implementation: Implementation;
  backendName: string;
  authStore: AuthStore | null;
  config: Config;
  user?: User | null;

  constructor(
    implementation: Implementation,
    { backendName, authStore = null, config }: BackendOptions = {},
  ) {
    // We can't reliably run this on exit, so we do cleanup on load.
    this.deleteAnonymousBackup();
    this.config = config as Config;
    this.implementation = implementation.init(this.config, {
      useWorkflow: this.config.get('publish_mode') === EDITORIAL_WORKFLOW,
      updateUserCredentials: this.updateUserCredentials,
      initialWorkflowStatus: status.first(),
    });
    this.backendName = backendName as string;
    this.authStore = authStore;
    if (this.implementation === null) {
      throw new Error('Cannot instantiate a Backend with no implementation');
    }
  }

  currentUser() {
    if (this.user) {
      return this.user;
    }
    const stored = this.authStore?.retrieve();
    if (stored && stored.backendName === this.backendName) {
      return Promise.resolve(this.implementation.restoreUser(stored)).then(user => {
        this.user = { ...user, backendName: this.backendName };
        // return confirmed/rehydrated user object instead of stored
        this.authStore?.store(this.user);
        return this.user;
      });
    }
    return Promise.resolve(null);
  }

  updateUserCredentials = (updatedCredentials: Credentials) => {
    const storedUser = this.authStore?.retrieve();
    if (storedUser && storedUser.backendName === this.backendName) {
      this.user = { ...storedUser, ...updatedCredentials };
      this.authStore?.store(this.user as User);
      return this.user;
    }
  };

  authComponent() {
    return this.implementation.authComponent();
  }

  authenticate(credentials: Credentials) {
    return this.implementation.authenticate(credentials).then(user => {
      this.user = { ...user, backendName: this.backendName };
      if (this.authStore) {
        this.authStore.store(this.user as User);
      }
      return this.user;
    });
  }

  logout() {
    return Promise.resolve(this.implementation.logout()).then(() => {
      this.user = null;
      if (this.authStore) {
        this.authStore.logout();
      }
    });
  }

  getToken = () => this.implementation.getToken();

  async entryExist(collection: Collection, path: string, slug: string) {
    const unpublishedEntry =
      this.implementation.unpublishedEntry &&
      (await this.implementation.unpublishedEntry(collection, slug).catch(error => {
        if (error instanceof EditorialWorkflowError && error.notUnderEditorialWorkflow) {
          return Promise.resolve(false);
        }
        return Promise.reject(error);
      }));

    if (unpublishedEntry) return unpublishedEntry;

    const publishedEntry = await this.implementation
      .getEntry(collection, slug, path)
      .then(({ data }) => data)
      .catch(() => {
        return Promise.resolve(false);
      });

    return publishedEntry;
  }

  async generateUniqueSlug(
    collection: Collection,
    entryData: EntryMap,
    slugConfig: SlugConfig,
    usedSlugs: List<string>,
  ) {
    const slug: string = slugFormatter(collection, entryData, slugConfig);
    let i = 1;
    let uniqueSlug = slug;

    // Check for duplicate slug in loaded entities store first before repo
    while (
      usedSlugs.includes(uniqueSlug) ||
      (await this.entryExist(
        collection,
        selectEntryPath(collection, uniqueSlug) as string,
        uniqueSlug,
      ))
    ) {
      uniqueSlug = `${slug}${sanitizeChar(' ', slugConfig)}${i++}`;
    }
    return uniqueSlug;
  }

  processEntries(loadedEntries: ImplementationEntry[], collection: Collection) {
    const collectionFilter = collection.get('filter');
    const entries = loadedEntries.map(loadedEntry =>
      createEntry(
        collection.get('name'),
        selectEntrySlug(collection, loadedEntry.file.path),
        loadedEntry.file.path,
        { raw: loadedEntry.data || '', label: loadedEntry.file.label },
      ),
    );
    const formattedEntries = entries.map(this.entryWithFormat(collection));
    // If this collection has a "filter" property, filter entries accordingly
    const filteredEntries = collectionFilter
      ? this.filterEntries({ entries: formattedEntries }, collectionFilter)
      : formattedEntries;
    return filteredEntries;
  }

  listEntries(collection: Collection) {
    const listMethod = this.implementation[selectListMethod(collection)];
    const extension = selectFolderEntryExtension(collection);
    return listMethod
      .call(this.implementation, collection, extension)
      .then((loadedEntries: ImplementationEntry[]) => ({
        entries: this.processEntries(loadedEntries, collection),
        /*
          Wrap cursors so we can tell which collection the cursor is
          from. This is done to prevent traverseCursor from requiring a
          `collection` argument.
        */
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        cursor: Cursor.create(loadedEntries[CURSOR_COMPATIBILITY_SYMBOL]).wrapData({
          cursorType: 'collectionEntries',
          collection,
        }),
      }));
  }

  // The same as listEntries, except that if a cursor with the "next"
  // action available is returned, it calls "next" on the cursor and
  // repeats the process. Once there is no available "next" action, it
  // returns all the collected entries. Used to retrieve all entries
  // for local searches and queries.
  async listAllEntries(collection: Collection) {
    if (collection.get('folder') && this.implementation.allEntriesByFolder) {
      const extension = selectFolderEntryExtension(collection);
      return this.implementation
        .allEntriesByFolder(collection, extension)
        .then(entries => this.processEntries(entries, collection));
    }

    const response = await this.listEntries(collection);
    const { entries } = response;
    let { cursor } = response;
    while (cursor && cursor.actions.includes('next')) {
      const { entries: newEntries, cursor: newCursor } = await this.traverseCursor(cursor, 'next');
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries;
  }

  async search(collections: Collection[], searchTerm: string) {
    // Perform a local search by requesting all entries. For each
    // collection, load it, search, and call onCollectionResults with
    // its results.
    const errors: Error[] = [];
    const collectionEntriesRequests = collections
      .map(async collection => {
        const summary = collection.get('summary', '') as string;
        const summaryFields = extractTemplateVars(summary);

        // TODO: pass search fields in as an argument
        const searchFields = [
          selectInferedField(collection, 'title'),
          selectInferedField(collection, 'shortTitle'),
          selectInferedField(collection, 'author'),
          ...summaryFields.map(elem => {
            if (dateParsers[elem]) {
              return selectInferedField(collection, 'date');
            }
            return elem;
          }),
        ].filter(Boolean) as string[];
        const collectionEntries = await this.listAllEntries(collection);
        return fuzzy.filter(searchTerm, collectionEntries, {
          extract: extractSearchFields(uniq(searchFields)),
        });
      })
      .map(p =>
        p.catch(err => {
          errors.push(err);
          return [] as fuzzy.FilterResult<EntryValue>[];
        }),
      );

    const entries = await Promise.all(collectionEntriesRequests).then(arrays => flatten(arrays));

    if (errors.length > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      throw new Error({ message: 'Errors ocurred while searching entries locally!', errors });
    }

    const hits = entries
      .filter(({ score }: fuzzy.FilterResult<EntryValue>) => score > 5)
      .sort(sortByScore)
      .map((f: fuzzy.FilterResult<EntryValue>) => f.original);
    return { entries: hits };
  }

  async query(collection: Collection, searchFields: string[], searchTerm: string) {
    const entries = await this.listAllEntries(collection);
    const hits = fuzzy
      .filter(searchTerm, entries, { extract: extractSearchFields(searchFields) })
      .sort(sortByScore)
      .map(f => f.original);
    return { query: searchTerm, hits };
  }

  traverseCursor(cursor: typeof Cursor, action: string) {
    const [data, unwrappedCursor] = cursor.unwrapData();
    // TODO: stop assuming all cursors are for collections
    const collection: Collection = data.get('collection');
    return this.implementation
      .traverseCursor(unwrappedCursor, action)
      .then(async ({ entries, cursor: newCursor }) => ({
        entries: this.processEntries(entries, collection),
        cursor: Cursor.create(newCursor).wrapData({
          cursorType: 'collectionEntries',
          collection,
        }),
      }));
  }

  async getLocalDraftBackup(collection: Collection, slug: string) {
    const key = getEntryBackupKey(collection.get('name'), slug);
    const backup = await localForage.getItem<BackupEntry>(key);
    if (!backup || !backup.raw.trim()) {
      return {};
    }
    const { raw, path } = backup;
    let { mediaFiles = [] } = backup;

    mediaFiles = mediaFiles.map(file => {
      // de-serialize the file object
      if (file.file) {
        return { ...file, url: URL.createObjectURL(file.file) };
      }
      return file;
    });

    const label = selectFileEntryLabel(collection, slug);
    const entry: EntryValue = this.entryWithFormat(collection)(
      createEntry(collection.get('name'), slug, path, { raw, label, mediaFiles }),
    );

    return { entry };
  }

  async persistLocalDraftBackup(entry: EntryMap, collection: Collection) {
    const key = getEntryBackupKey(collection.get('name'), entry.get('slug'));
    const raw = this.entryToRaw(collection, entry);
    if (!raw.trim()) {
      return;
    }

    const mediaFiles = await Promise.all<BackupMediaFile>(
      entry
        .get('mediaFiles')
        .toJS()
        .map(async (file: MediaFile) => {
          // make sure to serialize the file
          if (file.url?.startsWith('blob:')) {
            const blob = await fetch(file.url).then(res => res.blob());
            return { ...file, file: new File([blob], file.name) };
          }
          return file;
        }),
    );

    await localForage.setItem<BackupEntry>(key, {
      raw,
      path: entry.get('path'),
      mediaFiles,
    });
    return localForage.setItem(getEntryBackupKey(), raw);
  }

  async deleteLocalDraftBackup(collection: Collection, slug: string) {
    const key = getEntryBackupKey(collection.get('name'), slug);
    await localForage.removeItem(key);
    return this.deleteAnonymousBackup();
  }

  // Unnamed backup for use in the global error boundary, should always be
  // deleted on cms load.
  deleteAnonymousBackup() {
    return localForage.removeItem(getEntryBackupKey());
  }

  async getEntry(state: State, collection: Collection, slug: string) {
    const path = selectEntryPath(collection, slug) as string;
    const label = selectFileEntryLabel(collection, slug);

    const workflowDraft = selectEditingWorkflowDraft(state);
    const integration = selectIntegration(state.integrations, null, 'assetStore');

    const [loadedEntry, mediaFiles] = await Promise.all([
      this.implementation.getEntry(collection, slug, path),
      workflowDraft && !integration
        ? this.implementation.getMedia(selectMediaFolder(state.config, collection, path))
        : Promise.resolve([]),
    ]);

    const entry = createEntry(collection.get('name'), slug, loadedEntry.file.path, {
      raw: loadedEntry.data,
      label,
      mediaFiles,
    });

    return this.entryWithFormat(collection)(entry);
  }

  getMedia() {
    return this.implementation.getMedia();
  }

  getMediaFile(path: string) {
    return this.implementation.getMediaFile(path);
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    if (this.implementation.getMediaDisplayURL) {
      return this.implementation.getMediaDisplayURL(displayURL);
    }
    const err = new Error(
      'getMediaDisplayURL is not implemented by the current backend, but the backend returned a displayURL which was not a string!',
    ) as Error & { displayURL: DisplayURL };
    err.displayURL = displayURL;
    return Promise.reject(err);
  }

  entryWithFormat(collectionOrEntity: unknown) {
    return (entry: EntryValue): EntryValue => {
      const format = resolveFormat(collectionOrEntity, entry);
      if (entry && entry.raw !== undefined) {
        const data = (format && attempt(format.fromFile.bind(format, entry.raw))) || {};
        if (isError(data)) console.error(data);
        return Object.assign(entry, { data: isError(data) ? {} : data });
      }
      return format.fromFile(entry);
    };
  }

  unpublishedEntries(collections: Collections) {
    return this.implementation
      .unpublishedEntries()
      .then(loadedEntries => loadedEntries.filter(entry => entry !== null))
      .then(entries =>
        entries.map(loadedEntry => {
          const collectionName = loadedEntry.metaData.collection;
          const collection = collections.find(c => c.get('name') === collectionName);
          const entry = createEntry(collectionName, loadedEntry.slug, loadedEntry.file.path, {
            raw: loadedEntry.data,
            isModification: loadedEntry.isModification,
            label: selectFileEntryLabel(collection, loadedEntry.slug),
          });
          entry.metaData = loadedEntry.metaData;
          return entry;
        }),
      )
      .then(entries => ({
        pagination: 0,
        entries: entries.reduce((acc, entry) => {
          const collection = collections.get(entry.collection);
          if (collection) {
            acc.push(this.entryWithFormat(collection)(entry) as EntryValue);
          }
          return acc;
        }, [] as EntryValue[]),
      }));
  }

  unpublishedEntry(collection: Collection, slug: string) {
    return this.implementation
      .unpublishedEntry?.(collection, slug)
      .then(loadedEntry => {
        const entry = createEntry(collection.get('name'), loadedEntry.slug, loadedEntry.file.path, {
          raw: loadedEntry.data,
          isModification: loadedEntry.isModification,
          metaData: loadedEntry.metaData,
          mediaFiles: loadedEntry.mediaFiles,
        });
        return entry;
      })
      .then(this.entryWithFormat(collection));
  }

  /**
   * Creates a URL using `site_url` from the config and `preview_path` from the
   * entry's collection. Does not currently make a request through the backend,
   * but likely will in the future.
   */
  getDeploy(collection: Collection, slug: string, entry: EntryMap) {
    /**
     * If `site_url` is undefined or `show_preview_links` in the config is set to false, do nothing.
     */

    const baseUrl = this.config.get('site_url');

    if (!baseUrl || this.config.get('show_preview_links') === false) {
      return;
    }

    return {
      url: createPreviewUrl(baseUrl, collection, slug, this.config.get('slug'), entry),
      status: 'SUCCESS',
    };
  }

  /**
   * Requests a base URL from the backend for previewing a specific entry.
   * Supports polling via `maxAttempts` and `interval` options, as there is
   * often a delay before a preview URL is available.
   */
  async getDeployPreview(
    collection: Collection,
    slug: string,
    entry: EntryMap,
    { maxAttempts = 1, interval = 5000 } = {},
  ) {
    /**
     * If the registered backend does not provide a `getDeployPreview` method, or
     * `show_preview_links` in the config is set to false, do nothing.
     */
    if (!this.implementation.getDeployPreview || this.config.get('show_preview_links') === false) {
      return;
    }

    /**
     * Poll for the deploy preview URL (defaults to 1 attempt, so no polling by
     * default).
     */
    let deployPreview,
      count = 0;
    while (!deployPreview && count < maxAttempts) {
      count++;
      deployPreview = await this.implementation.getDeployPreview(collection, slug);
      if (!deployPreview) {
        await new Promise(resolve => setTimeout(() => resolve(), interval));
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
      url: createPreviewUrl(deployPreview.url, collection, slug, this.config.get('slug'), entry),
      /**
       * Always capitalize the status for consistency.
       */
      status: deployPreview.status ? deployPreview.status.toUpperCase() : '',
    };
  }

  async persistEntry({
    config,
    collection,
    entryDraft,
    assetProxies,
    integrations,
    usedSlugs,
    unpublished = false,
    status,
  }: PersistArgs) {
    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;

    const parsedData = {
      title: entryDraft.getIn(['entry', 'data', 'title'], 'No Title'),
      description: entryDraft.getIn(['entry', 'data', 'description'], 'No Description!'),
    };

    let entryObj: {
      path: string;
      slug: string;
      raw: string;
    };

    if (newEntry) {
      if (!selectAllowNewEntries(collection)) {
        throw new Error('Not allowed to create new entries in this collection');
      }
      const slug = await this.generateUniqueSlug(
        collection,
        entryDraft.getIn(['entry', 'data']),
        config.get('slug'),
        usedSlugs,
      );
      const path = selectEntryPath(collection, slug) as string;

      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
      };

      assetProxies.map(asset => {
        // update media files path based on entry path
        const oldPath = asset.path;
        const newPath = selectMediaFilePath(config, collection, path, oldPath);
        asset.path = newPath;
      });
    } else {
      const path = entryDraft.getIn(['entry', 'path']);
      const slug = entryDraft.getIn(['entry', 'slug']);
      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
      };
    }

    const user = (await this.currentUser()) as User;
    const commitMessage = commitMessageFormatter(
      newEntry ? 'create' : 'update',
      config,
      {
        collection,
        slug: entryObj.slug,
        path: entryObj.path,
        authorLogin: user.login,
        authorName: user.name,
      },
      user.useOpenAuthoring,
    );

    const useWorkflow = config.get('publish_mode') === EDITORIAL_WORKFLOW;

    const collectionName = collection.get('name');

    /**
     * Determine whether an asset store integration is in use.
     */
    const hasAssetStore = integrations && !!selectIntegration(integrations, null, 'assetStore');
    const updatedOptions = { unpublished, hasAssetStore, status };
    const opts = {
      newEntry,
      parsedData,
      commitMessage,
      collectionName,
      useWorkflow,
      ...updatedOptions,
    };

    return this.implementation.persistEntry(entryObj, assetProxies, opts).then(() => entryObj.slug);
  }

  async persistMedia(config: Config, file: AssetProxy) {
    const user = (await this.currentUser()) as User;
    const options = {
      commitMessage: commitMessageFormatter(
        'uploadMedia',
        config,
        {
          slug: '',
          collection: '',
          path: file.path,
          authorLogin: user.login,
          authorName: user.name,
        },
        user.useOpenAuthoring,
      ),
    };
    return this.implementation.persistMedia(file, options);
  }

  async deleteEntry(config: Config, collection: Collection, slug: string) {
    const path = selectEntryPath(collection, slug) as string;

    if (!selectAllowDeletion(collection)) {
      throw new Error('Not allowed to delete entries in this collection');
    }

    const user = (await this.currentUser()) as User;
    const commitMessage = commitMessageFormatter(
      'delete',
      config,
      {
        collection,
        slug,
        path,
        authorLogin: user.login,
        authorName: user.name,
      },
      user.useOpenAuthoring,
    );
    return this.implementation.deleteFile(path, commitMessage, { collection, slug });
  }

  async deleteMedia(config: Config, path: string) {
    const user = (await this.currentUser()) as User;
    const commitMessage = commitMessageFormatter(
      'deleteMedia',
      config,
      {
        slug: '',
        collection: '',
        path,
        authorLogin: user.login,
        authorName: user.name,
      },
      user.useOpenAuthoring,
    );
    return this.implementation.deleteFile(path, commitMessage);
  }

  persistUnpublishedEntry(args: PersistArgs) {
    return this.persistEntry({ ...args, unpublished: true });
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    return this.implementation.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }

  publishUnpublishedEntry(collection: string, slug: string) {
    return this.implementation.publishUnpublishedEntry(collection, slug);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    return this.implementation.deleteUnpublishedEntry(collection, slug);
  }

  entryToRaw(collection: Collection, entry: EntryMap): string {
    const format = resolveFormat(collection, entry.toJS());
    const fieldsOrder = this.fieldsOrder(collection, entry);
    return format && format.toFile(entry.get('data').toJS(), fieldsOrder);
  }

  fieldsOrder(collection: Collection, entry: EntryMap) {
    const fields = collection.get('fields');
    if (fields) {
      return collection
        .get('fields')
        .map(f => f?.get('name'))
        .toArray();
    }

    const files = collection.get('files');
    const file = (files || List<CollectionFile>())
      .filter(f => f?.get('name') === entry.get('slug'))
      .get(0);

    if (file == null) {
      throw new Error(`No file found for ${entry.get('slug')} in ${collection.get('name')}`);
    }
    return file
      .get('fields')
      .map(f => f?.get('name'))
      .toArray();
  }

  filterEntries(collection: { entries: EntryValue[] }, filterRule: FilterRule) {
    return collection.entries.filter(entry => {
      const fieldValue = entry.data[filterRule.get('field')];
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(filterRule.get('value'));
      }
      return fieldValue === filterRule.get('value');
    });
  }
}

export function resolveBackend(config: Config) {
  const name = config.getIn(['backend', 'name']);
  if (name == null) {
    throw new Error('No backend defined in configuration');
  }

  const authStore = new LocalStorageAuthStore();

  if (!getBackend(name)) {
    throw new Error(`Backend not found: ${name}`);
  } else {
    return new Backend(getBackend(name), { backendName: name, authStore, config });
  }
}

export const currentBackend = (function() {
  let backend: Backend;

  return (config: Config) => {
    if (backend) {
      return backend;
    }

    return (backend = resolveBackend(config));
  };
})();
