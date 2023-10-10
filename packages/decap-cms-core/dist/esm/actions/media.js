"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REMOVE_ASSET = exports.LOAD_ASSET_SUCCESS = exports.LOAD_ASSET_REQUEST = exports.LOAD_ASSET_FAILURE = exports.ADD_ASSETS = exports.ADD_ASSET = void 0;
exports.addAsset = addAsset;
exports.addAssets = addAssets;
exports.boundGetAsset = boundGetAsset;
exports.getAsset = getAsset;
exports.loadAsset = loadAsset;
exports.loadAssetFailure = loadAssetFailure;
exports.loadAssetRequest = loadAssetRequest;
exports.loadAssetSuccess = loadAssetSuccess;
exports.removeAsset = removeAsset;
var _decapCmsLibUtil = require("decap-cms-lib-util");
var _AssetProxy = require("../valueObjects/AssetProxy");
var _entries = require("../reducers/entries");
var _mediaLibrary = require("../reducers/mediaLibrary");
var _mediaLibrary2 = require("./mediaLibrary");
const ADD_ASSETS = 'ADD_ASSETS';
exports.ADD_ASSETS = ADD_ASSETS;
const ADD_ASSET = 'ADD_ASSET';
exports.ADD_ASSET = ADD_ASSET;
const REMOVE_ASSET = 'REMOVE_ASSET';
exports.REMOVE_ASSET = REMOVE_ASSET;
const LOAD_ASSET_REQUEST = 'LOAD_ASSET_REQUEST';
exports.LOAD_ASSET_REQUEST = LOAD_ASSET_REQUEST;
const LOAD_ASSET_SUCCESS = 'LOAD_ASSET_SUCCESS';
exports.LOAD_ASSET_SUCCESS = LOAD_ASSET_SUCCESS;
const LOAD_ASSET_FAILURE = 'LOAD_ASSET_FAILURE';
exports.LOAD_ASSET_FAILURE = LOAD_ASSET_FAILURE;
function addAssets(assets) {
  return {
    type: ADD_ASSETS,
    payload: assets
  };
}
function addAsset(assetProxy) {
  return {
    type: ADD_ASSET,
    payload: assetProxy
  };
}
function removeAsset(path) {
  return {
    type: REMOVE_ASSET,
    payload: path
  };
}
function loadAssetRequest(path) {
  return {
    type: LOAD_ASSET_REQUEST,
    payload: {
      path
    }
  };
}
function loadAssetSuccess(path) {
  return {
    type: LOAD_ASSET_SUCCESS,
    payload: {
      path
    }
  };
}
function loadAssetFailure(path, error) {
  return {
    type: LOAD_ASSET_FAILURE,
    payload: {
      path,
      error
    }
  };
}
function loadAsset(resolvedPath) {
  return async (dispatch, getState) => {
    try {
      dispatch(loadAssetRequest(resolvedPath));
      // load asset url from backend
      await (0, _mediaLibrary2.waitForMediaLibraryToLoad)(dispatch, getState());
      const file = (0, _mediaLibrary.selectMediaFileByPath)(getState(), resolvedPath);
      if (file) {
        const url = await (0, _mediaLibrary2.getMediaDisplayURL)(dispatch, getState(), file);
        const asset = (0, _AssetProxy.createAssetProxy)({
          path: resolvedPath,
          url: url || resolvedPath
        });
        dispatch(addAsset(asset));
      } else {
        const {
          url
        } = await (0, _mediaLibrary2.getMediaFile)(getState(), resolvedPath);
        const asset = (0, _AssetProxy.createAssetProxy)({
          path: resolvedPath,
          url
        });
        dispatch(addAsset(asset));
      }
      dispatch(loadAssetSuccess(resolvedPath));
    } catch (e) {
      dispatch(loadAssetFailure(resolvedPath, e));
    }
  };
}
const emptyAsset = (0, _AssetProxy.createAssetProxy)({
  path: 'empty.svg',
  file: new File([`<svg xmlns="http://www.w3.org/2000/svg"></svg>`], 'empty.svg', {
    type: 'image/svg+xml'
  })
});
function boundGetAsset(dispatch, collection, entry) {
  function bound(path, field) {
    const asset = dispatch(getAsset({
      collection,
      entry,
      path,
      field
    }));
    return asset;
  }
  return bound;
}
function getAsset({
  collection,
  entry,
  path,
  field
}) {
  return (dispatch, getState) => {
    if (!path) return emptyAsset;
    const state = getState();
    const resolvedPath = (0, _entries.selectMediaFilePath)(state.config, collection, entry, path, field);
    let {
      asset,
      isLoading,
      error
    } = state.medias[resolvedPath] || {};
    if (isLoading) {
      return emptyAsset;
    }
    if (asset) {
      // There is already an AssetProxy in memory for this path. Use it.
      return asset;
    }
    if ((0, _decapCmsLibUtil.isAbsolutePath)(resolvedPath)) {
      // asset path is a public url so we can just use it as is
      asset = (0, _AssetProxy.createAssetProxy)({
        path: resolvedPath,
        url: path
      });
      dispatch(addAsset(asset));
    } else {
      if (error) {
        // on load error default back to original path
        asset = (0, _AssetProxy.createAssetProxy)({
          path: resolvedPath,
          url: path
        });
        dispatch(addAsset(asset));
      } else {
        dispatch(loadAsset(resolvedPath));
        asset = emptyAsset;
      }
    }
    return asset;
  };
}