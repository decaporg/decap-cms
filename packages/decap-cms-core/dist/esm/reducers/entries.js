"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.selectEditingDraft = selectEditingDraft;
exports.selectEntries = selectEntries;
exports.selectEntriesFilter = selectEntriesFilter;
exports.selectEntriesFilterFields = selectEntriesFilterFields;
exports.selectEntriesGroup = selectEntriesGroup;
exports.selectEntriesGroupField = selectEntriesGroupField;
exports.selectEntriesLoaded = selectEntriesLoaded;
exports.selectEntriesSort = selectEntriesSort;
exports.selectEntriesSortFields = selectEntriesSortFields;
exports.selectEntry = selectEntry;
exports.selectEntryByPath = selectEntryByPath;
exports.selectGroups = selectGroups;
exports.selectIsFetching = selectIsFetching;
exports.selectMediaFilePath = selectMediaFilePath;
exports.selectMediaFilePublicPath = selectMediaFilePublicPath;
exports.selectMediaFolder = selectMediaFolder;
exports.selectPublishedSlugs = selectPublishedSlugs;
exports.selectViewStyle = selectViewStyle;
var _groupBy2 = _interopRequireDefault(require("lodash/groupBy"));
var _orderBy2 = _interopRequireDefault(require("lodash/orderBy"));
var _set2 = _interopRequireDefault(require("lodash/set"));
var _sortBy2 = _interopRequireDefault(require("lodash/sortBy"));
var _once2 = _interopRequireDefault(require("lodash/once"));
var _trim2 = _interopRequireDefault(require("lodash/trim"));
var _immutable = require("immutable");
var _path = require("path");
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _decapCmsLibWidgets = require("decap-cms-lib-widgets");
var _redux = require("../types/redux");
var _formatters = require("../lib/formatters");
var _collections = require("./collections");
var _search = require("../actions/search");
var _entries = require("../actions/entries");
var _collectionViews = require("../constants/collectionViews");
var _urlHelper = require("../lib/urlHelper");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const {
  keyToPathArray
} = _decapCmsLibWidgets.stringTemplate;
let collection;
let loadedEntries;
let append;
let page;
let slug;
const storageSortKey = 'decap-cms.entries.sort';
const viewStyleKey = 'decap-cms.entries.viewStyle';
const loadSort = (0, _once2.default)(() => {
  const sortString = localStorage.getItem(storageSortKey);
  if (sortString) {
    try {
      const sort = JSON.parse(sortString);
      let map = (0, _immutable.Map)();
      Object.entries(sort).forEach(([collection, sort]) => {
        let orderedMap = (0, _immutable.OrderedMap)();
        (0, _sortBy2.default)(Object.values(sort), ['index']).forEach(value => {
          const {
            key,
            direction
          } = value;
          orderedMap = orderedMap.set(key, (0, _immutable.fromJS)({
            key,
            direction
          }));
        });
        map = map.set(collection, orderedMap);
      });
      return map;
    } catch (e) {
      return (0, _immutable.Map)();
    }
  }
  return (0, _immutable.Map)();
});
function clearSort() {
  localStorage.removeItem(storageSortKey);
}
function persistSort(sort) {
  if (sort) {
    const storageSort = {};
    sort.keySeq().forEach(key => {
      const collection = key;
      const sortObjects = sort.get(collection).valueSeq().toJS().map((value, index) => _objectSpread(_objectSpread({}, value), {}, {
        index
      }));
      sortObjects.forEach(value => {
        (0, _set2.default)(storageSort, [collection, value.key], value);
      });
    });
    localStorage.setItem(storageSortKey, JSON.stringify(storageSort));
  } else {
    clearSort();
  }
}
const loadViewStyle = (0, _once2.default)(() => {
  const viewStyle = localStorage.getItem(viewStyleKey);
  if (viewStyle) {
    return viewStyle;
  }
  localStorage.setItem(viewStyleKey, _collectionViews.VIEW_STYLE_LIST);
  return _collectionViews.VIEW_STYLE_LIST;
});
function clearViewStyle() {
  localStorage.removeItem(viewStyleKey);
}
function persistViewStyle(viewStyle) {
  if (viewStyle) {
    localStorage.setItem(viewStyleKey, viewStyle);
  } else {
    clearViewStyle();
  }
}
function entries(state = (0, _immutable.Map)({
  entities: (0, _immutable.Map)(),
  pages: (0, _immutable.Map)(),
  sort: loadSort(),
  viewStyle: loadViewStyle()
}), action) {
  switch (action.type) {
    case _entries.ENTRY_REQUEST:
      {
        const payload = action.payload;
        return state.setIn(['entities', `${payload.collection}.${payload.slug}`, 'isFetching'], true);
      }
    case _entries.ENTRY_SUCCESS:
      {
        const payload = action.payload;
        collection = payload.collection;
        slug = payload.entry.slug;
        return state.withMutations(map => {
          map.setIn(['entities', `${collection}.${slug}`], (0, _immutable.fromJS)(payload.entry));
          const ids = map.getIn(['pages', collection, 'ids'], (0, _immutable.List)());
          if (!ids.includes(slug)) {
            map.setIn(['pages', collection, 'ids'], ids.unshift(slug));
          }
        });
      }
    case _entries.ENTRIES_REQUEST:
      {
        const payload = action.payload;
        const newState = state.withMutations(map => {
          map.setIn(['pages', payload.collection, 'isFetching'], true);
        });
        return newState;
      }
    case _entries.ENTRIES_SUCCESS:
      {
        const payload = action.payload;
        collection = payload.collection;
        loadedEntries = payload.entries;
        append = payload.append;
        page = payload.page;
        return state.withMutations(map => {
          loadedEntries.forEach(entry => map.setIn(['entities', `${collection}.${entry.slug}`], (0, _immutable.fromJS)(entry).set('isFetching', false)));
          const ids = (0, _immutable.List)(loadedEntries.map(entry => entry.slug));
          map.setIn(['pages', collection], (0, _immutable.Map)({
            page,
            ids: append ? map.getIn(['pages', collection, 'ids'], (0, _immutable.List)()).concat(ids) : ids
          }));
        });
      }
    case _entries.ENTRIES_FAILURE:
      return state.setIn(['pages', action.meta.collection, 'isFetching'], false);
    case _entries.ENTRY_FAILURE:
      {
        const payload = action.payload;
        return state.withMutations(map => {
          map.setIn(['entities', `${payload.collection}.${payload.slug}`, 'isFetching'], false);
          map.setIn(['entities', `${payload.collection}.${payload.slug}`, 'error'], payload.error.message);
        });
      }
    case _search.SEARCH_ENTRIES_SUCCESS:
      {
        const payload = action.payload;
        loadedEntries = payload.entries;
        return state.withMutations(map => {
          loadedEntries.forEach(entry => map.setIn(['entities', `${entry.collection}.${entry.slug}`], (0, _immutable.fromJS)(entry).set('isFetching', false)));
        });
      }
    case _entries.ENTRY_DELETE_SUCCESS:
      {
        const payload = action.payload;
        return state.withMutations(map => {
          map.deleteIn(['entities', `${payload.collectionName}.${payload.entrySlug}`]);
          map.updateIn(['pages', payload.collectionName, 'ids'], ids => ids.filter(id => id !== payload.entrySlug));
        });
      }
    case _entries.SORT_ENTRIES_REQUEST:
      {
        const payload = action.payload;
        const {
          collection,
          key,
          direction
        } = payload;
        const newState = state.withMutations(map => {
          const sort = (0, _immutable.OrderedMap)({
            [key]: (0, _immutable.Map)({
              key,
              direction
            })
          });
          map.setIn(['sort', collection], sort);
          map.setIn(['pages', collection, 'isFetching'], true);
          map.deleteIn(['pages', collection, 'page']);
        });
        persistSort(newState.get('sort'));
        return newState;
      }
    case _entries.GROUP_ENTRIES_SUCCESS:
    case _entries.FILTER_ENTRIES_SUCCESS:
    case _entries.SORT_ENTRIES_SUCCESS:
      {
        const payload = action.payload;
        const {
          collection,
          entries
        } = payload;
        loadedEntries = entries;
        const newState = state.withMutations(map => {
          loadedEntries.forEach(entry => map.setIn(['entities', `${entry.collection}.${entry.slug}`], (0, _immutable.fromJS)(entry).set('isFetching', false)));
          map.setIn(['pages', collection, 'isFetching'], false);
          const ids = (0, _immutable.List)(loadedEntries.map(entry => entry.slug));
          map.setIn(['pages', collection], (0, _immutable.Map)({
            page: 1,
            ids
          }));
        });
        return newState;
      }
    case _entries.SORT_ENTRIES_FAILURE:
      {
        const payload = action.payload;
        const {
          collection,
          key
        } = payload;
        const newState = state.withMutations(map => {
          map.deleteIn(['sort', collection, key]);
          map.setIn(['pages', collection, 'isFetching'], false);
        });
        persistSort(newState.get('sort'));
        return newState;
      }
    case _entries.FILTER_ENTRIES_REQUEST:
      {
        const payload = action.payload;
        const {
          collection,
          filter
        } = payload;
        const newState = state.withMutations(map => {
          const current = map.getIn(['filter', collection, filter.id], (0, _immutable.fromJS)(filter));
          map.setIn(['filter', collection, current.get('id')], current.set('active', !current.get('active')));
        });
        return newState;
      }
    case _entries.FILTER_ENTRIES_FAILURE:
      {
        const payload = action.payload;
        const {
          collection,
          filter
        } = payload;
        const newState = state.withMutations(map => {
          map.deleteIn(['filter', collection, filter.id]);
          map.setIn(['pages', collection, 'isFetching'], false);
        });
        return newState;
      }
    case _entries.GROUP_ENTRIES_REQUEST:
      {
        const payload = action.payload;
        const {
          collection,
          group
        } = payload;
        const newState = state.withMutations(map => {
          const current = map.getIn(['group', collection, group.id], (0, _immutable.fromJS)(group));
          map.deleteIn(['group', collection]);
          map.setIn(['group', collection, current.get('id')], current.set('active', !current.get('active')));
        });
        return newState;
      }
    case _entries.GROUP_ENTRIES_FAILURE:
      {
        const payload = action.payload;
        const {
          collection,
          group
        } = payload;
        const newState = state.withMutations(map => {
          map.deleteIn(['group', collection, group.id]);
          map.setIn(['pages', collection, 'isFetching'], false);
        });
        return newState;
      }
    case _entries.CHANGE_VIEW_STYLE:
      {
        const payload = action.payload;
        const {
          style
        } = payload;
        const newState = state.withMutations(map => {
          map.setIn(['viewStyle'], style);
        });
        persistViewStyle(newState.get('viewStyle'));
        return newState;
      }
    default:
      return state;
  }
}
function selectEntriesSort(entries, collection) {
  const sort = entries.get('sort');
  return sort === null || sort === void 0 ? void 0 : sort.get(collection);
}
function selectEntriesFilter(entries, collection) {
  const filter = entries.get('filter');
  return (filter === null || filter === void 0 ? void 0 : filter.get(collection)) || (0, _immutable.Map)();
}
function selectEntriesGroup(entries, collection) {
  const group = entries.get('group');
  return (group === null || group === void 0 ? void 0 : group.get(collection)) || (0, _immutable.Map)();
}
function selectEntriesGroupField(entries, collection) {
  const groups = selectEntriesGroup(entries, collection);
  const value = groups === null || groups === void 0 ? void 0 : groups.valueSeq().find(v => (v === null || v === void 0 ? void 0 : v.get('active')) === true);
  return value;
}
function selectEntriesSortFields(entries, collection) {
  const sort = selectEntriesSort(entries, collection);
  const values = (sort === null || sort === void 0 ? void 0 : sort.valueSeq().filter(v => (v === null || v === void 0 ? void 0 : v.get('direction')) !== _redux.SortDirection.None).toArray()) || [];
  return values;
}
function selectEntriesFilterFields(entries, collection) {
  const filter = selectEntriesFilter(entries, collection);
  const values = (filter === null || filter === void 0 ? void 0 : filter.valueSeq().filter(v => (v === null || v === void 0 ? void 0 : v.get('active')) === true).toArray()) || [];
  return values;
}
function selectViewStyle(entries) {
  return entries.get('viewStyle');
}
function selectEntry(state, collection, slug) {
  return state.getIn(['entities', `${collection}.${slug}`]);
}
function selectPublishedSlugs(state, collection) {
  return state.getIn(['pages', collection, 'ids'], (0, _immutable.List)());
}
function getPublishedEntries(state, collectionName) {
  const slugs = selectPublishedSlugs(state, collectionName);
  const entries = slugs && slugs.map(slug => selectEntry(state, collectionName, slug));
  return entries;
}
function selectEntries(state, collection) {
  const collectionName = collection.get('name');
  let entries = getPublishedEntries(state, collectionName);
  const sortFields = selectEntriesSortFields(state, collectionName);
  if (sortFields && sortFields.length > 0) {
    const keys = sortFields.map(v => (0, _collections.selectSortDataPath)(collection, v.get('key')));
    const orders = sortFields.map(v => v.get('direction') === _redux.SortDirection.Ascending ? 'asc' : 'desc');
    entries = (0, _immutable.fromJS)((0, _orderBy2.default)(entries.toJS(), keys, orders));
  }
  const filters = selectEntriesFilterFields(state, collectionName);
  if (filters && filters.length > 0) {
    entries = entries.filter(e => {
      const allMatched = filters.every(f => {
        const pattern = f.get('pattern');
        const field = f.get('field');
        const data = e.get('data') || (0, _immutable.Map)();
        const toMatch = data.getIn(keyToPathArray(field));
        const matched = toMatch !== undefined && new RegExp(String(pattern)).test(String(toMatch));
        return matched;
      });
      return allMatched;
    }).toList();
  }
  return entries;
}
function getGroup(entry, selectedGroup) {
  const label = selectedGroup.get('label');
  const field = selectedGroup.get('field');
  const fieldData = entry.getIn(['data', ...keyToPathArray(field)]);
  if (fieldData === undefined) {
    return {
      id: 'missing_value',
      label,
      value: fieldData
    };
  }
  const dataAsString = String(fieldData);
  if (selectedGroup.has('pattern')) {
    const pattern = selectedGroup.get('pattern');
    let value = '';
    try {
      const regex = new RegExp(pattern);
      const matched = dataAsString.match(regex);
      if (matched) {
        value = matched[0];
      }
    } catch (e) {
      console.warn(`Invalid view group pattern '${pattern}' for field '${field}'`, e);
    }
    return {
      id: `${label}${value}`,
      label,
      value
    };
  }
  return {
    id: `${label}${fieldData}`,
    label,
    value: typeof fieldData === 'boolean' ? fieldData : dataAsString
  };
}
function selectGroups(state, collection) {
  const collectionName = collection.get('name');
  const entries = getPublishedEntries(state, collectionName);
  const selectedGroup = selectEntriesGroupField(state, collectionName);
  if (selectedGroup === undefined) {
    return [];
  }
  let groups = {};
  const groupedEntries = (0, _groupBy2.default)(entries.toArray(), entry => {
    const group = getGroup(entry, selectedGroup);
    groups = _objectSpread(_objectSpread({}, groups), {}, {
      [group.id]: group
    });
    return group.id;
  });
  const groupsArray = Object.entries(groupedEntries).map(([id, entries]) => {
    return _objectSpread(_objectSpread({}, groups[id]), {}, {
      paths: (0, _immutable.Set)(entries.map(entry => entry.get('path')))
    });
  });
  return groupsArray;
}
function selectEntryByPath(state, collection, path) {
  const slugs = selectPublishedSlugs(state, collection);
  const entries = slugs && slugs.map(slug => selectEntry(state, collection, slug));
  return entries && entries.find(e => (e === null || e === void 0 ? void 0 : e.get('path')) === path);
}
function selectEntriesLoaded(state, collection) {
  return !!state.getIn(['pages', collection]);
}
function selectIsFetching(state, collection) {
  return state.getIn(['pages', collection, 'isFetching'], false);
}
const DRAFT_MEDIA_FILES = 'DRAFT_MEDIA_FILES';
function getFileField(collectionFiles, slug) {
  const file = collectionFiles.find(f => (f === null || f === void 0 ? void 0 : f.get('name')) === slug);
  return file;
}
function hasCustomFolder(folderKey, collection, slug, field) {
  if (!collection) {
    return false;
  }
  if (field && field.has(folderKey)) {
    return true;
  }
  if (collection.has('files')) {
    const file = getFileField(collection.get('files'), slug);
    if (file && file.has(folderKey)) {
      return true;
    }
  }
  if (collection.has(folderKey)) {
    return true;
  }
  return false;
}
function traverseFields(folderKey, config, collection, entryMap, field, fields, currentFolder) {
  const matchedField = fields.filter(f => f === field)[0];
  if (matchedField) {
    return (0, _formatters.folderFormatter)(matchedField.has(folderKey) ? matchedField.get(folderKey) : `{{${folderKey}}}`, entryMap, collection, currentFolder, folderKey, config.slug);
  }
  for (let f of fields) {
    if (!f.has(folderKey)) {
      // add identity template if doesn't exist
      f = f.set(folderKey, `{{${folderKey}}}`);
    }
    const folder = (0, _formatters.folderFormatter)(f.get(folderKey), entryMap, collection, currentFolder, folderKey, config.slug);
    let fieldFolder = null;
    if (f.has('fields')) {
      fieldFolder = traverseFields(folderKey, config, collection, entryMap, field, f.get('fields').toArray(), folder);
    } else if (f.has('field')) {
      fieldFolder = traverseFields(folderKey, config, collection, entryMap, field, [f.get('field')], folder);
    } else if (f.has('types')) {
      fieldFolder = traverseFields(folderKey, config, collection, entryMap, field, f.get('types').toArray(), folder);
    }
    if (fieldFolder != null) {
      return fieldFolder;
    }
  }
  return null;
}
function evaluateFolder(folderKey, config, collection, entryMap, field) {
  let currentFolder = config[folderKey];

  // add identity template if doesn't exist
  if (!collection.has(folderKey)) {
    collection = collection.set(folderKey, `{{${folderKey}}}`);
  }
  if (collection.has('files')) {
    // files collection evaluate the collection template
    // then move on to the specific file configuration denoted by the slug
    currentFolder = (0, _formatters.folderFormatter)(collection.get(folderKey), entryMap, collection, currentFolder, folderKey, config.slug);
    let file = getFileField(collection.get('files'), entryMap === null || entryMap === void 0 ? void 0 : entryMap.get('slug'));
    if (file) {
      if (!file.has(folderKey)) {
        // add identity template if doesn't exist
        file = file.set(folderKey, `{{${folderKey}}}`);
      }

      // evaluate the file template and keep evaluating until we match our field
      currentFolder = (0, _formatters.folderFormatter)(file.get(folderKey), entryMap, collection, currentFolder, folderKey, config.slug);
      if (field) {
        const fieldFolder = traverseFields(folderKey, config, collection, entryMap, field, file.get('fields').toArray(), currentFolder);
        if (fieldFolder !== null) {
          currentFolder = fieldFolder;
        }
      }
    }
  } else {
    // folder collection, evaluate the collection template
    // and keep evaluating until we match our field
    currentFolder = (0, _formatters.folderFormatter)(collection.get(folderKey), entryMap, collection, currentFolder, folderKey, config.slug);
    if (field) {
      const fieldFolder = traverseFields(folderKey, config, collection, entryMap, field, collection.get('fields').toArray(), currentFolder);
      if (fieldFolder !== null) {
        currentFolder = fieldFolder;
      }
    }
  }
  return currentFolder;
}
function selectMediaFolder(config, collection, entryMap, field) {
  const name = 'media_folder';
  let mediaFolder = config[name];
  const customFolder = hasCustomFolder(name, collection, entryMap === null || entryMap === void 0 ? void 0 : entryMap.get('slug'), field);
  if (customFolder) {
    const folder = evaluateFolder(name, config, collection, entryMap, field);
    if (folder.startsWith('/')) {
      // return absolute paths as is
      mediaFolder = (0, _path.join)(folder);
    } else {
      const entryPath = entryMap === null || entryMap === void 0 ? void 0 : entryMap.get('path');
      mediaFolder = entryPath ? (0, _path.join)((0, _path.dirname)(entryPath), folder) : (0, _path.join)(collection.get('folder'), DRAFT_MEDIA_FILES);
    }
  }
  return (0, _trim2.default)(mediaFolder, '/');
}
function selectMediaFilePath(config, collection, entryMap, mediaPath, field) {
  if ((0, _decapCmsLibUtil.isAbsolutePath)(mediaPath)) {
    return mediaPath;
  }
  const mediaFolder = selectMediaFolder(config, collection, entryMap, field);
  return (0, _path.join)(mediaFolder, (0, _decapCmsLibUtil.basename)(mediaPath));
}
function selectMediaFilePublicPath(config, collection, mediaPath, entryMap, field) {
  if ((0, _decapCmsLibUtil.isAbsolutePath)(mediaPath)) {
    return mediaPath;
  }
  const name = 'public_folder';
  let publicFolder = config[name];
  const customFolder = hasCustomFolder(name, collection, entryMap === null || entryMap === void 0 ? void 0 : entryMap.get('slug'), field);
  if (customFolder) {
    publicFolder = evaluateFolder(name, config, collection, entryMap, field);
  }
  if ((0, _decapCmsLibUtil.isAbsolutePath)(publicFolder)) {
    return (0, _urlHelper.joinUrlPath)(publicFolder, (0, _decapCmsLibUtil.basename)(mediaPath));
  }
  return (0, _path.join)(publicFolder, (0, _decapCmsLibUtil.basename)(mediaPath));
}
function selectEditingDraft(state) {
  const entry = state.get('entry');
  const workflowDraft = entry && !entry.isEmpty();
  return workflowDraft;
}
var _default = entries;
exports.default = _default;