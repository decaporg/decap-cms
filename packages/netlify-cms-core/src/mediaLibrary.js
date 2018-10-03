/**
 * This module is currently concerned only with external media libraries
 * registered via `registerMediaLibrary`.
 */
import { once } from 'lodash';
import { getMediaLibrary } from 'Lib/registry';
import store from 'Redux';
import { createMediaLibrary, insertMedia, persistMedia } from 'Actions/mediaLibrary';

const initializeMediaLibrary = once(async function initializeMediaLibrary(name, options) {
  const lib = getMediaLibrary(name);
  const handleInsert = url => store.dispatch(insertMedia(url));
  const handlePersist = file => store.dispatch(persistMedia(file));
  const getState = () => store.getState()

  const instance = await lib.init({ options, handleInsert, handlePersist, getState });

  store.dispatch(createMediaLibrary(instance));
});

store.subscribe(() => {
  const state = store.getState();
  const mediaLibraryName = state.config.getIn(['media_library', 'name']);
  if (mediaLibraryName && !state.mediaLibrary.get('externalLibrary')) {
    const mediaLibraryConfig = state.config.get('media_library').toJS();
    initializeMediaLibrary(mediaLibraryName, mediaLibraryConfig);
  }
});
