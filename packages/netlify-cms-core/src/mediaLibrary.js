/**
 * This module is currently concerned only with external media libraries
 * registered via `registerMediaLibrary`.
 */
import { once } from 'lodash';
import { getMediaLibrary } from 'Lib/registry';
import store from 'Redux';
import {
  createMediaLibrary,
  insertMedia,
  persistMedia,
  deleteMedia,
  loadMedia,
} from 'Actions/mediaLibrary';
import { bindActionCreators } from 'redux';

const initializeMediaLibrary = once(async function initializeMediaLibrary(name, options) {
  const lib = getMediaLibrary(name);
  const mediaLibraryActions = bindActionCreators(
    {
      insertMedia,
      persistMedia,
      deleteMedia,
      loadMedia,
    },
    store.dispatch,
  );

  const instance = await lib.init({ options, store, mediaLibraryActions });

  await store.dispatch(createMediaLibrary(instance));

  if (instance.getReducer()) {
    store.attachReducers({ [name]: instance.getReducer() });
  }
});

store.subscribe(() => {
  const state = store.getState();
  const mediaLibraryName = state.config.getIn(['media_library', 'name']);
  if (mediaLibraryName && !state.mediaLibrary.get('externalLibrary')) {
    const mediaLibraryConfig = state.config.get('media_library').toJS();
    initializeMediaLibrary(mediaLibraryName, mediaLibraryConfig);
  }
});
