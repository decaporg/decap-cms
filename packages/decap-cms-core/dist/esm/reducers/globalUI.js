"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _immer = require("immer");
var _auth = require("../actions/auth");
const LOADING_IGNORE_LIST = ['DEPLOY_PREVIEW', 'STATUS_REQUEST', 'STATUS_SUCCESS', 'STATUS_FAILURE'];
function ignoreWhenLoading(action) {
  return LOADING_IGNORE_LIST.some(type => action.type.includes(type));
}
const defaultState = {
  isFetching: false,
  useOpenAuthoring: false
};

/**
 * Reducer for some global UI state that we want to share between components
 */
const globalUI = (0, _immer.produce)((state, action) => {
  // Generic, global loading indicator
  if (!ignoreWhenLoading(action) && action.type.includes('REQUEST')) {
    state.isFetching = true;
  } else if (!ignoreWhenLoading(action) && (action.type.includes('SUCCESS') || action.type.includes('FAILURE'))) {
    state.isFetching = false;
  } else if (action.type === _auth.USE_OPEN_AUTHORING) {
    state.useOpenAuthoring = true;
  }
}, defaultState);
var _default = globalUI;
exports.default = _default;