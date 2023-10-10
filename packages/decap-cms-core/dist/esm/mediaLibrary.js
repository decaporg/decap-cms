"use strict";

var _once2 = _interopRequireDefault(require("lodash/once"));
var _registry = require("./lib/registry");
var _redux = require("./redux");
var _config = require("./actions/config");
var _mediaLibrary = require("./actions/mediaLibrary");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * This module is currently concerned only with external media libraries
 * registered via `registerMediaLibrary`.
 */

function handleInsert(url) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return _redux.store.dispatch((0, _mediaLibrary.insertMedia)(url, undefined));
}
const initializeMediaLibrary = (0, _once2.default)(async function initializeMediaLibrary(name, options) {
  const lib = (0, _registry.getMediaLibrary)(name);
  if (!lib) {
    const err = new Error(`Missing external media library '${name}'. Please use 'registerMediaLibrary' to register it.`);
    _redux.store.dispatch((0, _config.configFailed)(err));
  } else {
    const instance = await lib.init({
      options,
      handleInsert
    });
    _redux.store.dispatch((0, _mediaLibrary.createMediaLibrary)(instance));
  }
});
_redux.store.subscribe(() => {
  const state = _redux.store.getState();
  if (state) {
    var _state$config$media_l;
    const mediaLibraryName = (_state$config$media_l = state.config.media_library) === null || _state$config$media_l === void 0 ? void 0 : _state$config$media_l.name;
    if (mediaLibraryName && !state.mediaLibrary.get('externalLibrary')) {
      const mediaLibraryConfig = state.config.media_library;
      initializeMediaLibrary(mediaLibraryName, mediaLibraryConfig);
    }
  }
});