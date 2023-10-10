"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DecapCmsMediaLibraryCloudinary = void 0;
var _pick2 = _interopRequireDefault(require("lodash/pick"));
var _decapCmsLibUtil = require("decap-cms-lib-util");
const _excluded = ["config"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
const defaultOptions = {
  use_secure_url: true,
  use_transformations: true,
  output_filename_only: false
};
/**
 * This configuration hash cannot be overridden, as the values here are required
 * for the integration to work properly.
 */
const enforcedConfig = {
  button_class: undefined,
  inline_container: undefined,
  insert_transformation: false,
  z_index: '99999'
};
const defaultConfig = {
  multiple: false
};
function getAssetUrl(asset, {
  use_secure_url,
  use_transformations,
  output_filename_only
}) {
  /**
   * Allow output of the file name only, in which case the rest of the url (including)
   * transformations) can be handled by the static site generator.
   */
  if (output_filename_only) {
    return `${asset.public_id}.${asset.format}`;
  }

  /**
   * Get url from `derived` property if it exists. This property contains the
   * transformed version of image if transformations have been applied.
   */
  const urlObject = asset.derived && use_transformations ? asset.derived[0] : asset;

  /**
   * Retrieve the `https` variant of the image url if the `useSecureUrl` option
   * is set to `true` (this is the default setting).
   */
  const urlKey = use_secure_url ? 'secure_url' : 'url';
  return urlObject[urlKey];
}
async function init({
  options = {},
  handleInsert
} = {}) {
  /**
   * Configuration is specific to Cloudinary, while options are specific to this
   * integration.
   */
  const {
      config: providedConfig = {}
    } = options,
    integrationOptions = _objectWithoutProperties(options, _excluded);
  const resolvedOptions = _objectSpread(_objectSpread({}, defaultOptions), integrationOptions);
  const cloudinaryConfig = _objectSpread(_objectSpread(_objectSpread({}, defaultConfig), providedConfig), enforcedConfig);
  const cloudinaryBehaviorConfigKeys = ['default_transformations', 'max_files', 'multiple'];
  const cloudinaryBehaviorConfig = (0, _pick2.default)(cloudinaryConfig, cloudinaryBehaviorConfigKeys);
  await (0, _decapCmsLibUtil.loadScript)('https://media-library.cloudinary.com/global/all.js');
  function insertHandler(data) {
    const assets = data.assets.map(asset => getAssetUrl(asset, resolvedOptions));
    handleInsert(providedConfig.multiple || assets.length > 1 ? assets : assets[0]);
  }
  const mediaLibrary = window.cloudinary.createMediaLibrary(cloudinaryConfig, {
    insertHandler
  });
  return {
    show: ({
      config: instanceConfig = {},
      allowMultiple
    } = {}) => {
      /**
       * Ensure multiple selection is not available if the field is configured
       * to disallow it.
       */
      if (allowMultiple === false) {
        instanceConfig.multiple = false;
      }
      return mediaLibrary.show(_objectSpread(_objectSpread({}, cloudinaryBehaviorConfig), instanceConfig));
    },
    hide: () => mediaLibrary.hide(),
    enableStandalone: () => true
  };
}
const cloudinaryMediaLibrary = {
  name: 'cloudinary',
  init
};
const DecapCmsMediaLibraryCloudinary = cloudinaryMediaLibrary;
exports.DecapCmsMediaLibraryCloudinary = DecapCmsMediaLibraryCloudinary;
var _default = cloudinaryMediaLibrary;
exports.default = _default;