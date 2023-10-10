"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.selectIsLoadingAsset = selectIsLoadingAsset;
var _immer = require("immer");
var _media = require("../actions/media");
const defaultState = {};
const medias = (0, _immer.produce)((state, action) => {
  switch (action.type) {
    case _media.ADD_ASSETS:
      {
        const assets = action.payload;
        assets.forEach(asset => {
          state[asset.path] = {
            asset,
            isLoading: false,
            error: null
          };
        });
        break;
      }
    case _media.ADD_ASSET:
      {
        const asset = action.payload;
        state[asset.path] = {
          asset,
          isLoading: false,
          error: null
        };
        break;
      }
    case _media.REMOVE_ASSET:
      {
        const path = action.payload;
        delete state[path];
        break;
      }
    case _media.LOAD_ASSET_REQUEST:
      {
        const {
          path
        } = action.payload;
        state[path] = state[path] || {};
        state[path].isLoading = true;
        break;
      }
    case _media.LOAD_ASSET_SUCCESS:
      {
        const {
          path
        } = action.payload;
        state[path] = state[path] || {};
        state[path].isLoading = false;
        state[path].error = null;
        break;
      }
    case _media.LOAD_ASSET_FAILURE:
      {
        const {
          path,
          error
        } = action.payload;
        state[path] = state[path] || {};
        state[path].isLoading = false;
        state[path].error = error;
      }
  }
}, defaultState);
function selectIsLoadingAsset(state) {
  return Object.values(state).some(state => state.isLoading);
}
var _default = medias;
exports.default = _default;