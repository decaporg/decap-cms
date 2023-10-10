"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.selectDeployPreview = selectDeployPreview;
var _immer = require("immer");
var _deploys = require("../actions/deploys");
const defaultState = {};
const deploys = (0, _immer.produce)((state, action) => {
  switch (action.type) {
    case _deploys.DEPLOY_PREVIEW_REQUEST:
      {
        const {
          collection,
          slug
        } = action.payload;
        const key = `${collection}.${slug}`;
        state[key] = state[key] || {};
        state[key].isFetching = true;
        break;
      }
    case _deploys.DEPLOY_PREVIEW_SUCCESS:
      {
        const {
          collection,
          slug,
          url,
          status
        } = action.payload;
        const key = `${collection}.${slug}`;
        state[key].isFetching = false;
        state[key].url = url;
        state[key].status = status;
        break;
      }
    case _deploys.DEPLOY_PREVIEW_FAILURE:
      {
        const {
          collection,
          slug
        } = action.payload;
        state[`${collection}.${slug}`].isFetching = false;
        break;
      }
  }
}, defaultState);
function selectDeployPreview(state, collection, slug) {
  return state[`${collection}.${slug}`];
}
var _default = deploys;
exports.default = _default;