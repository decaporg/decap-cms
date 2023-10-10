"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.commitMessageFormatter = commitMessageFormatter;
exports.folderFormatter = folderFormatter;
exports.getProcessSegment = getProcessSegment;
exports.prepareSlug = prepareSlug;
exports.previewUrlFormatter = previewUrlFormatter;
exports.slugFormatter = slugFormatter;
exports.summaryFormatter = summaryFormatter;
var _trimStart2 = _interopRequireDefault(require("lodash/trimStart"));
var _trimEnd2 = _interopRequireDefault(require("lodash/trimEnd"));
var _partialRight2 = _interopRequireDefault(require("lodash/partialRight"));
var _flow2 = _interopRequireDefault(require("lodash/flow"));
var _decapCmsLibWidgets = require("decap-cms-lib-widgets");
var _commonTags = require("common-tags");
var _collections = require("../reducers/collections");
var _urlHelper = require("./urlHelper");
var _collectionTypes = require("../constants/collectionTypes");
var _commitProps = require("../constants/commitProps");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const {
  compileStringTemplate,
  parseDateFromEntry,
  SLUG_MISSING_REQUIRED_DATE,
  keyToPathArray,
  addFileTemplateFields
} = _decapCmsLibWidgets.stringTemplate;
const commitMessageTemplates = {
  create: 'Create {{collection}} “{{slug}}”',
  update: 'Update {{collection}} “{{slug}}”',
  delete: 'Delete {{collection}} “{{slug}}”',
  uploadMedia: 'Upload “{{path}}”',
  deleteMedia: 'Delete “{{path}}”',
  openAuthoring: '{{message}}'
};
const variableRegex = /\{\{([^}]+)\}\}/g;
function commitMessageFormatter(type, config, {
  slug,
  path,
  collection,
  authorLogin,
  authorName
}, isOpenAuthoring) {
  const templates = _objectSpread(_objectSpread({}, commitMessageTemplates), config.backend.commit_messages || {});
  const commitMessage = templates[type].replace(variableRegex, (_, variable) => {
    switch (variable) {
      case 'slug':
        return slug || '';
      case 'path':
        return path || '';
      case 'collection':
        return collection ? collection.get('label_singular') || collection.get('label') : '';
      case 'author-login':
        return authorLogin || '';
      case 'author-name':
        return authorName || '';
      default:
        console.warn(`Ignoring unknown variable “${variable}” in commit message template.`);
        return '';
    }
  });
  if (!isOpenAuthoring) {
    return commitMessage;
  }
  const message = templates.openAuthoring.replace(variableRegex, (_, variable) => {
    switch (variable) {
      case 'message':
        return commitMessage;
      case 'author-login':
        return authorLogin || '';
      case 'author-name':
        return authorName || '';
      default:
        console.warn(`Ignoring unknown variable “${variable}” in open authoring message template.`);
        return '';
    }
  });
  return message;
}
function prepareSlug(slug) {
  return slug.trim()
  // Convert slug to lower-case
  .toLocaleLowerCase()

  // Remove single quotes.
  .replace(/[']/g, '')

  // Replace periods with dashes.
  .replace(/[.]/g, '-');
}
function getProcessSegment(slugConfig, ignoreValues) {
  return value => ignoreValues && ignoreValues.includes(value) ? value : (0, _flow2.default)([value => String(value), prepareSlug, (0, _partialRight2.default)(_urlHelper.sanitizeSlug, slugConfig)])(value);
}
function slugFormatter(collection, entryData, slugConfig) {
  const slugTemplate = collection.get('slug') || '{{slug}}';
  const identifier = entryData.getIn(keyToPathArray((0, _collections.selectIdentifier)(collection)));
  if (!identifier) {
    throw new Error('Collection must have a field name that is a valid entry identifier, or must have `identifier_field` set');
  }
  const processSegment = getProcessSegment(slugConfig);
  const date = new Date();
  const slug = compileStringTemplate(slugTemplate, date, identifier, entryData, processSegment);
  if (!collection.has('path')) {
    return slug;
  } else {
    const pathTemplate = prepareSlug(collection.get('path'));
    return compileStringTemplate(pathTemplate, date, slug, entryData, value => value === slug ? value : processSegment(value));
  }
}
function previewUrlFormatter(baseUrl, collection, slug, entry, slugConfig) {
  /**
   * Preview URL can't be created without `baseUrl`. This makes preview URLs
   * optional for backends that don't support them.
   */
  if (!baseUrl) {
    return;
  }
  const basePath = (0, _trimEnd2.default)(baseUrl, '/');
  const isFileCollection = collection.get('type') === _collectionTypes.FILES;
  const file = isFileCollection ? (0, _collections.getFileFromSlug)(collection, entry.get('slug')) : undefined;
  function getPathTemplate() {
    var _file$get;
    return (_file$get = file === null || file === void 0 ? void 0 : file.get('preview_path')) !== null && _file$get !== void 0 ? _file$get : collection.get('preview_path');
  }
  function getDateField() {
    var _file$get2;
    return (_file$get2 = file === null || file === void 0 ? void 0 : file.get('preview_path_date_field')) !== null && _file$get2 !== void 0 ? _file$get2 : collection.get('preview_path_date_field');
  }

  /**
   * If a `previewPath` is provided for the collection/file, use it to construct the
   * URL path.
   */
  const pathTemplate = getPathTemplate();

  /**
   * Without a `previewPath` for the collection/file (via config), the preview URL
   * will be the URL provided by the backend.
   */
  if (!pathTemplate) {
    return baseUrl;
  }
  let fields = entry.get('data');
  fields = addFileTemplateFields(entry.get('path'), fields, collection.get('folder'));
  const dateFieldName = getDateField() || (0, _collections.selectInferedField)(collection, 'date');
  const date = parseDateFromEntry(entry, dateFieldName);

  // Prepare and sanitize slug variables only, leave the rest of the
  // `preview_path` template as is.
  const processSegment = getProcessSegment(slugConfig, [fields.get('dirname')]);
  let compiledPath;
  try {
    compiledPath = compileStringTemplate(pathTemplate, date, slug, fields, processSegment);
  } catch (err) {
    // Print an error and ignore `preview_path` if both:
    //   1. Date is invalid (according to Moment), and
    //   2. A date expression (eg. `{{year}}`) is used in `preview_path`
    if (err.name === SLUG_MISSING_REQUIRED_DATE) {
      console.error((0, _commonTags.stripIndent)`
        Collection "${collection.get('name')}" configuration error:
          \`preview_path_date_field\` must be a field with a valid date. Ignoring \`preview_path\`.
      `);
      return basePath;
    }
    throw err;
  }
  const previewPath = (0, _trimStart2.default)(compiledPath, ' /');
  return `${basePath}/${previewPath}`;
}
function summaryFormatter(summaryTemplate, entry, collection) {
  let entryData = entry.get('data');
  const date = parseDateFromEntry(entry, (0, _collections.selectInferedField)(collection, 'date')) || null;
  const identifier = entryData.getIn(keyToPathArray((0, _collections.selectIdentifier)(collection)));
  entryData = addFileTemplateFields(entry.get('path'), entryData, collection.get('folder'));
  // allow commit information in summary template
  if (entry.get('author') && !(0, _collections.selectField)(collection, _commitProps.COMMIT_AUTHOR)) {
    entryData = entryData.set(_commitProps.COMMIT_AUTHOR, entry.get('author'));
  }
  if (entry.get('updatedOn') && !(0, _collections.selectField)(collection, _commitProps.COMMIT_DATE)) {
    entryData = entryData.set(_commitProps.COMMIT_DATE, entry.get('updatedOn'));
  }
  const summary = compileStringTemplate(summaryTemplate, date, identifier, entryData);
  return summary;
}
function folderFormatter(folderTemplate, entry, collection, defaultFolder, folderKey, slugConfig) {
  if (!entry || !entry.get('data')) {
    return folderTemplate;
  }
  let fields = entry.get('data').set(folderKey, defaultFolder);
  fields = addFileTemplateFields(entry.get('path'), fields, collection.get('folder'));
  const date = parseDateFromEntry(entry, (0, _collections.selectInferedField)(collection, 'date')) || null;
  const identifier = fields.getIn(keyToPathArray((0, _collections.selectIdentifier)(collection)));
  const processSegment = getProcessSegment(slugConfig, [defaultFolder, fields.get('dirname')]);
  const mediaFolder = compileStringTemplate(folderTemplate, date, identifier, fields, processSegment);
  return mediaFolder;
}