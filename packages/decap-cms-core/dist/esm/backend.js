"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.currentBackend = exports.LocalStorageAuthStore = exports.Backend = void 0;
exports.expandSearchEntries = expandSearchEntries;
exports.extractSearchFields = extractSearchFields;
exports.mergeExpandedEntries = mergeExpandedEntries;
exports.resolveBackend = resolveBackend;
exports.slugFromCustomPath = slugFromCustomPath;
var _set2 = _interopRequireDefault(require("lodash/set"));
var _get2 = _interopRequireDefault(require("lodash/get"));
var _sortBy2 = _interopRequireDefault(require("lodash/sortBy"));
var _trim2 = _interopRequireDefault(require("lodash/trim"));
var _uniq2 = _interopRequireDefault(require("lodash/uniq"));
var _isError2 = _interopRequireDefault(require("lodash/isError"));
var _flatten2 = _interopRequireDefault(require("lodash/flatten"));
var _attempt2 = _interopRequireDefault(require("lodash/attempt"));
var _immutable = require("immutable");
var fuzzy = _interopRequireWildcard(require("fuzzy"));
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _path = require("path");
var _decapCmsLibWidgets = require("decap-cms-lib-widgets");
var _formats = require("./formats/formats");
var _config = require("./reducers/config");
var _entries = require("./reducers/entries");
var _integrations = require("./reducers/integrations");
var _collections = require("./reducers/collections");
var _Entry = require("./valueObjects/Entry");
var _urlHelper = require("./lib/urlHelper");
var _registry = require("./lib/registry");
var _formatters = require("./lib/formatters");
var _publishModes = require("./constants/publishModes");
var _collectionTypes = require("./constants/collectionTypes");
var _entryDraft = require("./reducers/entryDraft");
var _i18n = require("./lib/i18n");
const _excluded = ["field"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const {
  extractTemplateVars,
  dateParsers,
  expandPath
} = _decapCmsLibWidgets.stringTemplate;
function updateAssetProxies(assetProxies, config, collection, entryDraft, path) {
  assetProxies.map(asset => {
    // update media files path based on entry path
    const oldPath = asset.path;
    const newPath = (0, _entries.selectMediaFilePath)(config, collection, entryDraft.get('entry').set('path', path), oldPath, asset.field);
    asset.path = newPath;
  });
}
class LocalStorageAuthStore {
  constructor() {
    _defineProperty(this, "storageKey", 'decap-cms-user');
  }
  retrieve() {
    const data = window.localStorage.getItem(this.storageKey);
    return data && JSON.parse(data);
  }
  store(userData) {
    window.localStorage.setItem(this.storageKey, JSON.stringify(userData));
  }
  logout() {
    window.localStorage.removeItem(this.storageKey);
  }
}
exports.LocalStorageAuthStore = LocalStorageAuthStore;
function getEntryBackupKey(collectionName, slug) {
  const baseKey = 'backup';
  if (!collectionName) {
    return baseKey;
  }
  const suffix = slug ? `.${slug}` : '';
  return `${baseKey}.${collectionName}${suffix}`;
}
function getEntryField(field, entry) {
  const value = (0, _get2.default)(entry.data, field);
  if (value) {
    return String(value);
  } else {
    const firstFieldPart = field.split('.')[0];
    if (entry[firstFieldPart]) {
      // allows searching using entry.slug/entry.path etc.
      return entry[firstFieldPart];
    } else {
      return '';
    }
  }
}
function extractSearchFields(searchFields) {
  return entry => searchFields.reduce((acc, field) => {
    const value = getEntryField(field, entry);
    if (value) {
      return `${acc} ${value}`;
    } else {
      return acc;
    }
  }, '');
}
function expandSearchEntries(entries, searchFields) {
  // expand the entries for the purpose of the search
  const expandedEntries = entries.reduce((acc, e) => {
    const expandedFields = searchFields.reduce((acc, f) => {
      const fields = expandPath({
        data: e.data,
        path: f
      });
      acc.push(...fields);
      return acc;
    }, []);
    for (let i = 0; i < expandedFields.length; i++) {
      acc.push(_objectSpread(_objectSpread({}, e), {}, {
        field: expandedFields[i]
      }));
    }
    return acc;
  }, []);
  return expandedEntries;
}
function mergeExpandedEntries(entries) {
  // merge the search results by slug and only keep data that matched the search
  const fields = entries.map(f => f.field);
  const arrayPaths = {};
  const merged = entries.reduce((acc, e) => {
    if (!acc[e.slug]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
          field
        } = e,
        rest = _objectWithoutProperties(e, _excluded);
      acc[e.slug] = rest;
      arrayPaths[e.slug] = (0, _immutable.Set)();
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
  }, {});

  // this keeps the search score sorting order designated by the order in entries
  // and filters non matching items
  Object.keys(merged).forEach(slug => {
    const data = merged[slug].data;
    for (const path of arrayPaths[slug].toArray()) {
      const array = (0, _get2.default)(data, path);
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
      (0, _set2.default)(data, path, filtered);
    }
  });
  return Object.values(merged);
}
function sortByScore(a, b) {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
}
function slugFromCustomPath(collection, customPath) {
  const folderPath = collection.get('folder', '');
  const entryPath = customPath.toLowerCase().replace(folderPath.toLowerCase(), '');
  const slug = (0, _path.join)((0, _path.dirname)((0, _trim2.default)(entryPath, '/')), (0, _path.basename)(entryPath, (0, _path.extname)(customPath)));
  return slug;
}
function prepareMetaPath(path, collection) {
  if (!(0, _collections.selectHasMetaPath)(collection)) {
    return path;
  }
  const dir = (0, _path.dirname)(path);
  return dir.slice(collection.get('folder').length + 1) || '/';
}
function collectionDepth(collection) {
  var _collection$get;
  let depth;
  depth = ((_collection$get = collection.get('nested')) === null || _collection$get === void 0 ? void 0 : _collection$get.get('depth')) || (0, _decapCmsLibUtil.getPathDepth)(collection.get('path', ''));
  if ((0, _i18n.hasI18n)(collection)) {
    depth = (0, _i18n.getI18nFilesDepth)(collection, depth);
  }
  return depth;
}
function collectionRegex(collection) {
  let ruleString = '';
  if (collection.get('path')) {
    ruleString = `${collection.get('folder')}/${collection.get('path')}`.replace(/{{.*}}/gm, '(.*)');
  }
  if ((0, _i18n.hasI18n)(collection)) {
    const {
      defaultLocale
    } = (0, _i18n.getI18nInfo)(collection);
    ruleString += `\\.${defaultLocale}\\..*`;
  }
  return ruleString ? new RegExp(ruleString) : undefined;
}
class Backend {
  constructor(implementation, {
    backendName,
    authStore,
    config
  }) {
    _defineProperty(this, "implementation", void 0);
    _defineProperty(this, "backendName", void 0);
    _defineProperty(this, "config", void 0);
    _defineProperty(this, "authStore", void 0);
    _defineProperty(this, "user", void 0);
    _defineProperty(this, "backupSync", void 0);
    _defineProperty(this, "updateUserCredentials", updatedCredentials => {
      const storedUser = this.authStore.retrieve();
      if (storedUser && storedUser.backendName === this.backendName) {
        this.user = _objectSpread(_objectSpread({}, storedUser), updatedCredentials);
        this.authStore.store(this.user);
        return this.user;
      }
    });
    _defineProperty(this, "getToken", () => this.implementation.getToken());
    // We can't reliably run this on exit, so we do cleanup on load.
    this.deleteAnonymousBackup();
    this.config = config;
    this.implementation = implementation.init(this.config, {
      useWorkflow: (0, _config.selectUseWorkflow)(this.config),
      updateUserCredentials: this.updateUserCredentials,
      initialWorkflowStatus: _publishModes.status.first()
    });
    this.backendName = backendName;
    this.authStore = authStore;
    if (this.implementation === null) {
      throw new Error('Cannot instantiate a Backend with no implementation');
    }
    this.backupSync = (0, _decapCmsLibUtil.asyncLock)();
  }
  async status() {
    const attempts = 3;
    let status = {
      auth: {
        status: true
      },
      api: {
        status: true,
        statusPage: ''
      }
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
    const stored = this.authStore.retrieve();
    if (stored && stored.backendName === this.backendName) {
      return Promise.resolve(this.implementation.restoreUser(stored)).then(user => {
        this.user = _objectSpread(_objectSpread({}, user), {}, {
          backendName: this.backendName
        });
        // return confirmed/rehydrated user object instead of stored
        this.authStore.store(this.user);
        return this.user;
      });
    }
    return Promise.resolve(null);
  }
  isGitBackend() {
    var _this$implementation$, _this$implementation;
    return ((_this$implementation$ = (_this$implementation = this.implementation).isGitBackend) === null || _this$implementation$ === void 0 ? void 0 : _this$implementation$.call(_this$implementation)) || false;
  }
  authComponent() {
    return this.implementation.authComponent();
  }
  authenticate(credentials) {
    return this.implementation.authenticate(credentials).then(user => {
      this.user = _objectSpread(_objectSpread({}, user), {}, {
        backendName: this.backendName
      });
      if (this.authStore) {
        this.authStore.store(this.user);
      }
      return this.user;
    });
  }
  async logout() {
    try {
      await this.implementation.logout();
    } catch (e) {
      console.warn('Error during logout', e.message);
    } finally {
      this.user = null;
      if (this.authStore) {
        this.authStore.logout();
      }
    }
  }
  async entryExist(collection, path, slug, useWorkflow) {
    const unpublishedEntry = useWorkflow && (await this.implementation.unpublishedEntry({
      collection: collection.get('name'),
      slug
    }).catch(error => {
      if (error.name === _decapCmsLibUtil.EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
        return Promise.resolve(false);
      }
      return Promise.reject(error);
    }));
    if (unpublishedEntry) return unpublishedEntry;
    const publishedEntry = await this.implementation.getEntry(path).then(({
      data
    }) => data).catch(() => {
      return Promise.resolve(false);
    });
    return publishedEntry;
  }
  async generateUniqueSlug(collection, entryData, config, usedSlugs, customPath) {
    const slugConfig = config.slug;
    let slug;
    if (customPath) {
      slug = slugFromCustomPath(collection, customPath);
    } else {
      slug = (0, _formatters.slugFormatter)(collection, entryData, slugConfig);
    }
    let i = 1;
    let uniqueSlug = slug;

    // Check for duplicate slug in loaded entities store first before repo
    while (usedSlugs.includes(uniqueSlug) || (await this.entryExist(collection, (0, _collections.selectEntryPath)(collection, uniqueSlug), uniqueSlug, (0, _config.selectUseWorkflow)(config)))) {
      uniqueSlug = `${slug}${(0, _urlHelper.sanitizeChar)(' ', slugConfig)}${i++}`;
    }
    return uniqueSlug;
  }
  processEntries(loadedEntries, collection) {
    const entries = loadedEntries.map(loadedEntry => (0, _Entry.createEntry)(collection.get('name'), (0, _collections.selectEntrySlug)(collection, loadedEntry.file.path), loadedEntry.file.path, {
      raw: loadedEntry.data || '',
      label: loadedEntry.file.label,
      author: loadedEntry.file.author,
      updatedOn: loadedEntry.file.updatedOn,
      meta: {
        path: prepareMetaPath(loadedEntry.file.path, collection)
      }
    }));
    const formattedEntries = entries.map(this.entryWithFormat(collection));
    // If this collection has a "filter" property, filter entries accordingly
    const collectionFilter = collection.get('filter');
    const filteredEntries = collectionFilter ? this.filterEntries({
      entries: formattedEntries
    }, collectionFilter) : formattedEntries;
    if ((0, _i18n.hasI18n)(collection)) {
      const extension = (0, _collections.selectFolderEntryExtension)(collection);
      const groupedEntries = (0, _i18n.groupEntries)(collection, extension, filteredEntries);
      return groupedEntries;
    }
    return filteredEntries;
  }
  async listEntries(collection) {
    var _cursor$meta;
    const extension = (0, _collections.selectFolderEntryExtension)(collection);
    let listMethod;
    const collectionType = collection.get('type');
    if (collectionType === _collectionTypes.FOLDER) {
      listMethod = () => {
        const depth = collectionDepth(collection);
        return this.implementation.entriesByFolder(collection.get('folder'), extension, depth);
      };
    } else if (collectionType === _collectionTypes.FILES) {
      const files = collection.get('files').map(collectionFile => ({
        path: collectionFile.get('file'),
        label: collectionFile.get('label')
      })).toArray();
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const cursor = _decapCmsLibUtil.Cursor.create(loadedEntries[_decapCmsLibUtil.CURSOR_COMPATIBILITY_SYMBOL]).wrapData({
      cursorType: 'collectionEntries',
      collection
    });
    return {
      entries: this.processEntries(loadedEntries, collection),
      pagination: (_cursor$meta = cursor.meta) === null || _cursor$meta === void 0 ? void 0 : _cursor$meta.get('page'),
      cursor
    };
  }

  // The same as listEntries, except that if a cursor with the "next"
  // action available is returned, it calls "next" on the cursor and
  // repeats the process. Once there is no available "next" action, it
  // returns all the collected entries. Used to retrieve all entries
  // for local searches and queries.
  async listAllEntries(collection) {
    if (collection.get('folder') && this.implementation.allEntriesByFolder) {
      const depth = collectionDepth(collection);
      const extension = (0, _collections.selectFolderEntryExtension)(collection);
      return this.implementation.allEntriesByFolder(collection.get('folder'), extension, depth, collectionRegex(collection)).then(entries => this.processEntries(entries, collection));
    }
    const response = await this.listEntries(collection);
    const {
      entries
    } = response;
    let {
      cursor
    } = response;
    while (cursor && cursor.actions.includes('next')) {
      const {
        entries: newEntries,
        cursor: newCursor
      } = await this.traverseCursor(cursor, 'next');
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries;
  }
  async search(collections, searchTerm) {
    // Perform a local search by requesting all entries. For each
    // collection, load it, search, and call onCollectionResults with
    // its results.
    const errors = [];
    const collectionEntriesRequests = collections.map(async collection => {
      const summary = collection.get('summary', '');
      const summaryFields = extractTemplateVars(summary);

      // TODO: pass search fields in as an argument
      let searchFields = [];
      if (collection.get('type') === _collectionTypes.FILES) {
        var _collection$get2;
        (_collection$get2 = collection.get('files')) === null || _collection$get2 === void 0 ? void 0 : _collection$get2.forEach(f => {
          const topLevelFields = f.get('fields').map(f => f.get('name')).toArray();
          searchFields = [...searchFields, ...topLevelFields];
        });
      } else {
        searchFields = [(0, _collections.selectInferedField)(collection, 'title'), (0, _collections.selectInferedField)(collection, 'shortTitle'), (0, _collections.selectInferedField)(collection, 'author'), ...summaryFields.map(elem => {
          if (dateParsers[elem]) {
            return (0, _collections.selectInferedField)(collection, 'date');
          }
          return elem;
        })];
      }
      const filteredSearchFields = searchFields.filter(Boolean);
      const collectionEntries = await this.listAllEntries(collection);
      return fuzzy.filter(searchTerm, collectionEntries, {
        extract: extractSearchFields((0, _uniq2.default)(filteredSearchFields))
      });
    }).map(p => p.catch(err => {
      errors.push(err);
      return [];
    }));
    const entries = await Promise.all(collectionEntriesRequests).then(arrays => (0, _flatten2.default)(arrays));
    if (errors.length > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new Error({
        message: 'Errors ocurred while searching entries locally!',
        errors
      });
    }
    const hits = entries.filter(({
      score
    }) => score > 5).sort(sortByScore).map(f => f.original);
    return {
      entries: hits
    };
  }
  async query(collection, searchFields, searchTerm, file, limit) {
    let entries = await this.listAllEntries(collection);
    if (file) {
      entries = entries.filter(e => e.slug === file);
    }
    const expandedEntries = expandSearchEntries(entries, searchFields);
    let hits = fuzzy.filter(searchTerm, expandedEntries, {
      extract: entry => {
        return getEntryField(entry.field, entry);
      }
    }).sort(sortByScore).map(f => f.original);
    if (limit !== undefined && limit > 0) {
      hits = hits.slice(0, limit);
    }
    const merged = mergeExpandedEntries(hits);
    return {
      query: searchTerm,
      hits: merged
    };
  }
  traverseCursor(cursor, action) {
    const [data, unwrappedCursor] = cursor.unwrapData();
    // TODO: stop assuming all cursors are for collections
    const collection = data.get('collection');
    return this.implementation.traverseCursor(unwrappedCursor, action).then(async ({
      entries,
      cursor: newCursor
    }) => ({
      entries: this.processEntries(entries, collection),
      cursor: _decapCmsLibUtil.Cursor.create(newCursor).wrapData({
        cursorType: 'collectionEntries',
        collection
      })
    }));
  }
  async getLocalDraftBackup(collection, slug) {
    const key = getEntryBackupKey(collection.get('name'), slug);
    const backup = await _decapCmsLibUtil.localForage.getItem(key);
    if (!backup || !backup.raw.trim()) {
      return {};
    }
    const {
      raw,
      path
    } = backup;
    let {
      mediaFiles = []
    } = backup;
    mediaFiles = mediaFiles.map(file => {
      // de-serialize the file object
      if (file.file) {
        return _objectSpread(_objectSpread({}, file), {}, {
          url: URL.createObjectURL(file.file)
        });
      }
      return file;
    });
    const label = (0, _collections.selectFileEntryLabel)(collection, slug);
    const formatRawData = raw => {
      return this.entryWithFormat(collection)((0, _Entry.createEntry)(collection.get('name'), slug, path, {
        raw,
        label,
        mediaFiles,
        meta: {
          path: prepareMetaPath(path, collection)
        }
      }));
    };
    const entry = formatRawData(raw);
    if ((0, _i18n.hasI18n)(collection) && backup.i18n) {
      const i18n = (0, _i18n.formatI18nBackup)(backup.i18n, formatRawData);
      entry.i18n = i18n;
    }
    return {
      entry
    };
  }
  async persistLocalDraftBackup(entry, collection) {
    try {
      await this.backupSync.acquire();
      const key = getEntryBackupKey(collection.get('name'), entry.get('slug'));
      const raw = this.entryToRaw(collection, entry);
      if (!raw.trim()) {
        return;
      }
      const mediaFiles = await Promise.all(entry.get('mediaFiles').toJS().map(async file => {
        var _file$url;
        // make sure to serialize the file
        if ((_file$url = file.url) !== null && _file$url !== void 0 && _file$url.startsWith('blob:')) {
          const blob = await fetch(file.url).then(res => res.blob());
          return _objectSpread(_objectSpread({}, file), {}, {
            file: (0, _decapCmsLibUtil.blobToFileObj)(file.name, blob)
          });
        }
        return file;
      }));
      let i18n;
      if ((0, _i18n.hasI18n)(collection)) {
        i18n = (0, _i18n.getI18nBackup)(collection, entry, entry => this.entryToRaw(collection, entry));
      }
      await _decapCmsLibUtil.localForage.setItem(key, _objectSpread({
        raw,
        path: entry.get('path'),
        mediaFiles
      }, i18n && {
        i18n
      }));
      const result = await _decapCmsLibUtil.localForage.setItem(getEntryBackupKey(), raw);
      return result;
    } catch (e) {
      console.warn('persistLocalDraftBackup', e);
    } finally {
      this.backupSync.release();
    }
  }
  async deleteLocalDraftBackup(collection, slug) {
    try {
      await this.backupSync.acquire();
      await _decapCmsLibUtil.localForage.removeItem(getEntryBackupKey(collection.get('name'), slug));
      // delete new entry backup if not deleted
      slug && (await _decapCmsLibUtil.localForage.removeItem(getEntryBackupKey(collection.get('name'))));
      const result = await this.deleteAnonymousBackup();
      return result;
    } catch (e) {
      console.warn('deleteLocalDraftBackup', e);
    } finally {
      this.backupSync.release();
    }
  }

  // Unnamed backup for use in the global error boundary, should always be
  // deleted on cms load.
  deleteAnonymousBackup() {
    return _decapCmsLibUtil.localForage.removeItem(getEntryBackupKey());
  }
  async getEntry(state, collection, slug) {
    const path = (0, _collections.selectEntryPath)(collection, slug);
    const label = (0, _collections.selectFileEntryLabel)(collection, slug);
    const extension = (0, _collections.selectFolderEntryExtension)(collection);
    const getEntryValue = async path => {
      const loadedEntry = await this.implementation.getEntry(path);
      let entry = (0, _Entry.createEntry)(collection.get('name'), slug, loadedEntry.file.path, {
        raw: loadedEntry.data,
        label,
        mediaFiles: [],
        meta: {
          path: prepareMetaPath(loadedEntry.file.path, collection)
        }
      });
      entry = this.entryWithFormat(collection)(entry);
      entry = await this.processEntry(state, collection, entry);
      return entry;
    };
    let entryValue;
    if ((0, _i18n.hasI18n)(collection)) {
      entryValue = await (0, _i18n.getI18nEntry)(collection, extension, path, slug, getEntryValue);
    } else {
      entryValue = await getEntryValue(path);
    }
    return entryValue;
  }
  getMedia() {
    return this.implementation.getMedia();
  }
  getMediaFile(path) {
    return this.implementation.getMediaFile(path);
  }
  getMediaDisplayURL(displayURL) {
    if (this.implementation.getMediaDisplayURL) {
      return this.implementation.getMediaDisplayURL(displayURL);
    }
    const err = new Error('getMediaDisplayURL is not implemented by the current backend, but the backend returned a displayURL which was not a string!');
    err.displayURL = displayURL;
    return Promise.reject(err);
  }
  entryWithFormat(collection) {
    return entry => {
      const format = (0, _formats.resolveFormat)(collection, entry);
      if (entry && entry.raw !== undefined) {
        const data = format && (0, _attempt2.default)(format.fromFile.bind(format, entry.raw)) || {};
        if ((0, _isError2.default)(data)) console.error(data);
        return Object.assign(entry, {
          data: (0, _isError2.default)(data) ? {} : data
        });
      }
      return format.fromFile(entry);
    };
  }
  async processUnpublishedEntry(collection, entryData, withMediaFiles) {
    const {
      slug
    } = entryData;
    let extension;
    if (collection.get('type') === _collectionTypes.FILES) {
      const file = collection.get('files').find(f => (f === null || f === void 0 ? void 0 : f.get('name')) === slug);
      extension = (0, _path.extname)(file.get('file'));
    } else {
      extension = (0, _collections.selectFolderEntryExtension)(collection);
    }
    const mediaFiles = [];
    if (withMediaFiles) {
      const nonDataFiles = entryData.diffs.filter(d => !d.path.endsWith(extension));
      const files = await Promise.all(nonDataFiles.map(f => this.implementation.unpublishedEntryMediaFile(collection.get('name'), slug, f.path, f.id)));
      mediaFiles.push(...files.map(f => _objectSpread(_objectSpread({}, f), {}, {
        draft: true
      })));
    }
    const dataFiles = (0, _sortBy2.default)(entryData.diffs.filter(d => d.path.endsWith(extension)), f => f.path.length);
    const formatData = (data, path, newFile) => {
      const entry = (0, _Entry.createEntry)(collection.get('name'), slug, path, {
        raw: data,
        isModification: !newFile,
        label: collection && (0, _collections.selectFileEntryLabel)(collection, slug),
        mediaFiles,
        updatedOn: entryData.updatedAt,
        author: entryData.pullRequestAuthor,
        status: entryData.status,
        meta: {
          path: prepareMetaPath(path, collection)
        }
      });
      const entryWithFormat = this.entryWithFormat(collection)(entry);
      return entryWithFormat;
    };
    const readAndFormatDataFile = async dataFile => {
      const data = await this.implementation.unpublishedEntryDataFile(collection.get('name'), entryData.slug, dataFile.path, dataFile.id);
      const entryWithFormat = formatData(data, dataFile.path, dataFile.newFile);
      return entryWithFormat;
    };

    // if the unpublished entry has no diffs, return the original
    if (dataFiles.length <= 0) {
      const loadedEntry = await this.implementation.getEntry((0, _collections.selectEntryPath)(collection, slug));
      return formatData(loadedEntry.data, loadedEntry.file.path, false);
    } else if ((0, _i18n.hasI18n)(collection)) {
      // we need to read all locales files and not just the changes
      const path = (0, _collections.selectEntryPath)(collection, slug);
      const i18nFiles = (0, _i18n.getI18nDataFiles)(collection, extension, path, slug, dataFiles);
      let entries = await Promise.all(i18nFiles.map(dataFile => readAndFormatDataFile(dataFile).catch(() => null)));
      entries = entries.filter(Boolean);
      const grouped = await (0, _i18n.groupEntries)(collection, extension, entries);
      return grouped[0];
    } else {
      const entryWithFormat = await readAndFormatDataFile(dataFiles[0]);
      return entryWithFormat;
    }
  }
  async unpublishedEntries(collections) {
    const ids = await this.implementation.unpublishedEntries();
    const entries = (await Promise.all(ids.map(async id => {
      const entryData = await this.implementation.unpublishedEntry({
        id
      });
      const collectionName = entryData.collection;
      const collection = collections.find(c => c.get('name') === collectionName);
      if (!collection) {
        console.warn(`Missing collection '${collectionName}' for unpublished entry '${id}'`);
        return null;
      }
      const entry = await this.processUnpublishedEntry(collection, entryData, false);
      return entry;
    }))).filter(Boolean);
    return {
      pagination: 0,
      entries
    };
  }
  async processEntry(state, collection, entry) {
    const integration = (0, _integrations.selectIntegration)(state.integrations, null, 'assetStore');
    const mediaFolders = (0, _collections.selectMediaFolders)(state.config, collection, (0, _immutable.fromJS)(entry));
    if (mediaFolders.length > 0 && !integration) {
      const files = await Promise.all(mediaFolders.map(folder => this.implementation.getMedia(folder)));
      entry.mediaFiles = entry.mediaFiles.concat(...files);
    } else {
      entry.mediaFiles = entry.mediaFiles.concat(state.mediaLibrary.get('files') || []);
    }
    return entry;
  }
  async unpublishedEntry(state, collection, slug) {
    const entryData = await this.implementation.unpublishedEntry({
      collection: collection.get('name'),
      slug
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
  getDeploy(collection, slug, entry) {
    /**
     * If `site_url` is undefined or `show_preview_links` in the config is set to false, do nothing.
     */

    const baseUrl = this.config.site_url;
    if (!baseUrl || this.config.show_preview_links === false) {
      return;
    }
    return {
      url: (0, _formatters.previewUrlFormatter)(baseUrl, collection, slug, entry, this.config.slug),
      status: 'SUCCESS'
    };
  }

  /**
   * Requests a base URL from the backend for previewing a specific entry.
   * Supports polling via `maxAttempts` and `interval` options, as there is
   * often a delay before a preview URL is available.
   */
  async getDeployPreview(collection, slug, entry, {
    maxAttempts = 1,
    interval = 5000
  } = {}) {
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
      count++;
      deployPreview = await this.implementation.getDeployPreview(collection.get('name'), slug);
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
      url: (0, _formatters.previewUrlFormatter)(deployPreview.url, collection, slug, entry, this.config.slug),
      /**
       * Always capitalize the status for consistency.
       */
      status: deployPreview.status ? deployPreview.status.toUpperCase() : ''
    };
  }
  async persistEntry({
    config,
    collection,
    entryDraft: draft,
    assetProxies,
    usedSlugs,
    unpublished = false,
    status
  }) {
    const modifiedData = await this.invokePreSaveEvent(draft.get('entry'));
    const entryDraft = modifiedData && draft.setIn(['entry', 'data'], modifiedData) || draft;
    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;
    const useWorkflow = (0, _config.selectUseWorkflow)(config);
    const customPath = (0, _entryDraft.selectCustomPath)(collection, entryDraft);
    let dataFile;
    if (newEntry) {
      if (!(0, _collections.selectAllowNewEntries)(collection)) {
        throw new Error('Not allowed to create new entries in this collection');
      }
      const slug = await this.generateUniqueSlug(collection, entryDraft.getIn(['entry', 'data']), config, usedSlugs, customPath);
      const path = customPath || (0, _collections.selectEntryPath)(collection, slug);
      dataFile = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry'))
      };
      updateAssetProxies(assetProxies, config, collection, entryDraft, path);
    } else {
      const slug = entryDraft.getIn(['entry', 'slug']);
      dataFile = {
        path: entryDraft.getIn(['entry', 'path']),
        // for workflow entries we refresh the slug on publish
        slug: customPath && !useWorkflow ? slugFromCustomPath(collection, customPath) : slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
        newPath: customPath
      };
    }
    const {
      slug,
      path,
      newPath
    } = dataFile;
    let dataFiles = [dataFile];
    if ((0, _i18n.hasI18n)(collection)) {
      const extension = (0, _collections.selectFolderEntryExtension)(collection);
      dataFiles = (0, _i18n.getI18nFiles)(collection, extension, entryDraft.get('entry'), draftData => this.entryToRaw(collection, draftData), path, slug, newPath);
    }
    const user = await this.currentUser();
    const commitMessage = (0, _formatters.commitMessageFormatter)(newEntry ? 'create' : 'update', config, {
      collection,
      slug,
      path,
      authorLogin: user.login,
      authorName: user.name
    }, user.useOpenAuthoring);
    const collectionName = collection.get('name');
    const updatedOptions = {
      unpublished,
      status
    };
    const opts = _objectSpread({
      newEntry,
      commitMessage,
      collectionName,
      useWorkflow
    }, updatedOptions);
    if (!useWorkflow) {
      await this.invokePrePublishEvent(entryDraft.get('entry'));
    }
    await this.implementation.persistEntry({
      dataFiles,
      assets: assetProxies
    }, opts);
    await this.invokePostSaveEvent(entryDraft.get('entry'));
    if (!useWorkflow) {
      await this.invokePostPublishEvent(entryDraft.get('entry'));
    }
    return slug;
  }
  async invokeEventWithEntry(event, entry) {
    const {
      login,
      name
    } = await this.currentUser();
    return await (0, _registry.invokeEvent)({
      name: event,
      data: {
        entry,
        author: {
          login,
          name
        }
      }
    });
  }
  async invokePrePublishEvent(entry) {
    await this.invokeEventWithEntry('prePublish', entry);
  }
  async invokePostPublishEvent(entry) {
    await this.invokeEventWithEntry('postPublish', entry);
  }
  async invokePreUnpublishEvent(entry) {
    await this.invokeEventWithEntry('preUnpublish', entry);
  }
  async invokePostUnpublishEvent(entry) {
    await this.invokeEventWithEntry('postUnpublish', entry);
  }
  async invokePreSaveEvent(entry) {
    return await this.invokeEventWithEntry('preSave', entry);
  }
  async invokePostSaveEvent(entry) {
    await this.invokeEventWithEntry('postSave', entry);
  }
  async persistMedia(config, file) {
    const user = await this.currentUser();
    const options = {
      commitMessage: (0, _formatters.commitMessageFormatter)('uploadMedia', config, {
        path: file.path,
        authorLogin: user.login,
        authorName: user.name
      }, user.useOpenAuthoring)
    };
    return this.implementation.persistMedia(file, options);
  }
  async deleteEntry(state, collection, slug) {
    const config = state.config;
    const path = (0, _collections.selectEntryPath)(collection, slug);
    const extension = (0, _collections.selectFolderEntryExtension)(collection);
    if (!(0, _collections.selectAllowDeletion)(collection)) {
      throw new Error('Not allowed to delete entries in this collection');
    }
    const user = await this.currentUser();
    const commitMessage = (0, _formatters.commitMessageFormatter)('delete', config, {
      collection,
      slug,
      path,
      authorLogin: user.login,
      authorName: user.name
    }, user.useOpenAuthoring);
    const entry = (0, _entries.selectEntry)(state.entries, collection.get('name'), slug);
    await this.invokePreUnpublishEvent(entry);
    let paths = [path];
    if ((0, _i18n.hasI18n)(collection)) {
      paths = (0, _i18n.getFilePaths)(collection, extension, path, slug);
    }
    await this.implementation.deleteFiles(paths, commitMessage);
    await this.invokePostUnpublishEvent(entry);
  }
  async deleteMedia(config, path) {
    const user = await this.currentUser();
    const commitMessage = (0, _formatters.commitMessageFormatter)('deleteMedia', config, {
      path,
      authorLogin: user.login,
      authorName: user.name
    }, user.useOpenAuthoring);
    return this.implementation.deleteFiles([path], commitMessage);
  }
  persistUnpublishedEntry(args) {
    return this.persistEntry(_objectSpread(_objectSpread({}, args), {}, {
      unpublished: true
    }));
  }
  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.implementation.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }
  async publishUnpublishedEntry(entry) {
    const collection = entry.get('collection');
    const slug = entry.get('slug');
    await this.invokePrePublishEvent(entry);
    await this.implementation.publishUnpublishedEntry(collection, slug);
    await this.invokePostPublishEvent(entry);
  }
  deleteUnpublishedEntry(collection, slug) {
    return this.implementation.deleteUnpublishedEntry(collection, slug);
  }
  entryToRaw(collection, entry) {
    const format = (0, _formats.resolveFormat)(collection, entry.toJS());
    const fieldsOrder = this.fieldsOrder(collection, entry);
    const fieldsComments = (0, _collections.selectFieldsComments)(collection, entry);
    return format && format.toFile(entry.get('data').toJS(), fieldsOrder, fieldsComments);
  }
  fieldsOrder(collection, entry) {
    const fields = collection.get('fields');
    if (fields) {
      return collection.get('fields').map(f => f.get('name')).toArray();
    }
    const files = collection.get('files');
    const file = (files || (0, _immutable.List)()).filter(f => f.get('name') === entry.get('slug')).get(0);
    if (file == null) {
      throw new Error(`No file found for ${entry.get('slug')} in ${collection.get('name')}`);
    }
    return file.get('fields').map(f => f.get('name')).toArray();
  }
  filterEntries(collection, filterRule) {
    return collection.entries.filter(entry => {
      const fieldValue = entry.data[filterRule.get('field')];
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(filterRule.get('value'));
      }
      return fieldValue === filterRule.get('value');
    });
  }
}
exports.Backend = Backend;
function resolveBackend(config) {
  if (!config.backend.name) {
    throw new Error('No backend defined in configuration');
  }
  const {
    name
  } = config.backend;
  const authStore = new LocalStorageAuthStore();
  const backend = (0, _registry.getBackend)(name);
  if (!backend) {
    throw new Error(`Backend not found: ${name}`);
  } else {
    return new Backend(backend, {
      backendName: name,
      authStore,
      config
    });
  }
}
const currentBackend = function () {
  let backend;
  return config => {
    if (backend) {
      return backend;
    }
    return backend = resolveBackend(config);
  };
}();
exports.currentBackend = currentBackend;