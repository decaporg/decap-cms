"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DecapCmsMediaLibraryUploadcare = void 0;
var _uploadcareWidget = _interopRequireDefault(require("uploadcare-widget"));
var _uploadcareWidgetTabEffects = _interopRequireDefault(require("uploadcare-widget-tab-effects"));
var _immutable = require("immutable");
const _excluded = ["publicKey"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
window.UPLOADCARE_LIVE = false;
window.UPLOADCARE_MANUAL_START = true;
const USER_AGENT = 'DecapCMS-Uploadcare-MediaLibrary';
const CDN_BASE_URL = 'https://ucarecdn.com';

/**
 * Default Uploadcare widget configuration, can be overridden via config.yml.
 */
const defaultConfig = {
  previewStep: true,
  integration: USER_AGENT
};

/**
 * Determine whether an array of urls represents an unaltered set of Uploadcare
 * group urls. If they've been changed or any are missing, a new group will need
 * to be created to represent the current values.
 */
function isFileGroup(files) {
  const basePatternString = `~${files.length}/nth/`;
  function mapExpression(val, idx) {
    return new RegExp(`${basePatternString}${idx}/$`);
  }
  const expressions = Array.from({
    length: files.length
  }, mapExpression);
  return expressions.every(exp => files.some(url => exp.test(url)));
}

/**
 * Returns a fileGroupInfo object wrapped in a promise-like object.
 */
function getFileGroup(files) {
  /**
   * Capture the group id from the first file in the files array.
   */
  const groupId = new RegExp(`^.+/([^/]+~${files.length})/nth/`).exec(files[0])[1];

  /**
   * The `openDialog` method handles the jQuery promise object returned by
   * `fileFrom`, but requires the promise returned by `loadFileGroup` to provide
   * the result of it's `done` method.
   */
  return new Promise(resolve => _uploadcareWidget.default.loadFileGroup(groupId).done(group => resolve(group)));
}

/**
 * Convert a url or array/List of urls to Uploadcare file objects wrapped in
 * promises, or Uploadcare groups when possible. Output is wrapped in a promise
 * because the value we're returning may be a promise that we created.
 */
function getFiles(value) {
  if (Array.isArray(value) || _immutable.Iterable.isIterable(value)) {
    const arr = Array.isArray(value) ? value : value.toJS();
    return isFileGroup(arr) ? getFileGroup(arr) : Promise.all(arr.map(val => getFile(val)));
  }
  return value && typeof value === 'string' ? getFile(value) : null;
}

/**
 * Convert a single url to an Uploadcare file object wrapped in a promise-like
 * object. Group urls that get passed here were not a part of a complete and
 * untouched group, so they'll be uploaded as new images (only way to do it).
 */
function getFile(url) {
  const groupPattern = /~\d+\/nth\/\d+\//;
  const uploaded = url.startsWith(CDN_BASE_URL) && !groupPattern.test(url);
  return _uploadcareWidget.default.fileFrom(uploaded ? 'uploaded' : 'url', url);
}

/**
 * Open the standalone dialog. A single instance is created and destroyed for
 * each use.
 */
function openDialog({
  files,
  config,
  handleInsert,
  settings = {}
}) {
  if (settings.defaultOperations && !settings.defaultOperations.startsWith('/')) {
    console.warn('Uploadcare default operations should start with `/`. Example: `/preview/-/resize/100x100/image.png`');
  }
  function buildUrl(fileInfo) {
    const {
      cdnUrl,
      name,
      isImage
    } = fileInfo;
    let url = isImage && settings.defaultOperations ? `${cdnUrl}-${settings.defaultOperations}` : cdnUrl;
    const filenameDefined = !url.endsWith('/');
    if (!filenameDefined && settings.autoFilename) {
      url = url + name;
    }
    return url;
  }
  _uploadcareWidget.default.openDialog(files, config).done(({
    promise,
    files
  }) => {
    const isGroup = Boolean(files);
    return promise().then(info => {
      if (isGroup) {
        return Promise.all(files().map(promise => promise.then(fileInfo => buildUrl(fileInfo)))).then(urls => handleInsert(urls));
      } else {
        handleInsert(buildUrl(info));
      }
    });
  });
}

/**
 * Initialization function will only run once, returns an API object for Decap
 * CMS to call methods on.
 */
async function init({
  options = {
    config: {},
    settings: {}
  },
  handleInsert
} = {}) {
  const _options$config = options.config,
    {
      publicKey
    } = _options$config,
    globalConfig = _objectWithoutProperties(_options$config, _excluded);
  const baseConfig = _objectSpread(_objectSpread({}, defaultConfig), globalConfig);
  window.UPLOADCARE_PUBLIC_KEY = publicKey;

  /**
   * Register the effects tab by default because the effects tab is awesome. Can
   * be disabled via config.
   */
  _uploadcareWidget.default.registerTab('preview', _uploadcareWidgetTabEffects.default);
  return {
    /**
     * On show, create a new widget, cache it in the widgets object, and open.
     * No hide method is provided because the widget doesn't provide it.
     */
    show: ({
      value,
      config: instanceConfig = {},
      allowMultiple,
      imagesOnly = false
    } = {}) => {
      const config = _objectSpread(_objectSpread({}, baseConfig), {}, {
        imagesOnly
      }, instanceConfig);
      const multiple = allowMultiple === false ? false : !!config.multiple;
      const resolvedConfig = _objectSpread(_objectSpread({}, config), {}, {
        multiple
      });
      const files = getFiles(value);

      /**
       * Resolve the promise only if it's ours. Only the jQuery promise objects
       * from the Uploadcare library will have a `state` method.
       */
      if (files && !files.state) {
        return files.then(result => openDialog({
          files: result,
          config: resolvedConfig,
          settings: options.settings,
          handleInsert
        }));
      } else {
        return openDialog({
          files,
          config: resolvedConfig,
          settings: options.settings,
          handleInsert
        });
      }
    },
    /**
     * Uploadcare doesn't provide a "media library" widget for viewing and
     * selecting existing files, so we return `false` here so Decap CMS only
     * opens the Uploadcare widget when called from an editor control. This
     * results in the "Media" button in the global nav being hidden.
     */
    enableStandalone: () => false
  };
}

/**
 * The object that will be registered only needs a (default) name and `init`
 * method. The `init` method returns the API object.
 */
const uploadcareMediaLibrary = {
  name: 'uploadcare',
  init
};
const DecapCmsMediaLibraryUploadcare = uploadcareMediaLibrary;
exports.DecapCmsMediaLibraryUploadcare = DecapCmsMediaLibraryUploadcare;
var _default = uploadcareMediaLibrary;
exports.default = _default;