"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEPLOY_PREVIEW_SUCCESS = exports.DEPLOY_PREVIEW_REQUEST = exports.DEPLOY_PREVIEW_FAILURE = void 0;
exports.loadDeployPreview = loadDeployPreview;
var _backend = require("../backend");
var _reducers = require("../reducers");
var _notifications = require("./notifications");
const DEPLOY_PREVIEW_REQUEST = 'DEPLOY_PREVIEW_REQUEST';
exports.DEPLOY_PREVIEW_REQUEST = DEPLOY_PREVIEW_REQUEST;
const DEPLOY_PREVIEW_SUCCESS = 'DEPLOY_PREVIEW_SUCCESS';
exports.DEPLOY_PREVIEW_SUCCESS = DEPLOY_PREVIEW_SUCCESS;
const DEPLOY_PREVIEW_FAILURE = 'DEPLOY_PREVIEW_FAILURE';
exports.DEPLOY_PREVIEW_FAILURE = DEPLOY_PREVIEW_FAILURE;
function deployPreviewLoading(collection, slug) {
  return {
    type: DEPLOY_PREVIEW_REQUEST,
    payload: {
      collection,
      slug
    }
  };
}
function deployPreviewLoaded(collection, slug, deploy) {
  const {
    url,
    status
  } = deploy;
  return {
    type: DEPLOY_PREVIEW_SUCCESS,
    payload: {
      collection,
      slug,
      url,
      status
    }
  };
}
function deployPreviewError(collection, slug) {
  return {
    type: DEPLOY_PREVIEW_FAILURE,
    payload: {
      collection,
      slug
    }
  };
}

/**
 * Requests a deploy preview object from the registered backend.
 */
function loadDeployPreview(collection, slug, entry, published, opts) {
  return async (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    const collectionName = collection.get('name');

    // Exit if currently fetching
    const deployState = (0, _reducers.selectDeployPreview)(state, collectionName, slug);
    if (deployState && deployState.isFetching) {
      return;
    }
    dispatch(deployPreviewLoading(collectionName, slug));
    try {
      /**
       * `getDeploy` is for published entries, while `getDeployPreview` is for
       * unpublished entries.
       */
      const deploy = published ? backend.getDeploy(collection, slug, entry) : await backend.getDeployPreview(collection, slug, entry, opts);
      if (deploy) {
        return dispatch(deployPreviewLoaded(collectionName, slug, deploy));
      }
      return dispatch(deployPreviewError(collectionName, slug));
    } catch (error) {
      console.error(error);
      dispatch((0, _notifications.addNotification)({
        message: {
          details: error.message,
          key: 'ui.toast.onFailToLoadDeployPreview'
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(deployPreviewError(collectionName, slug));
    }
  };
}