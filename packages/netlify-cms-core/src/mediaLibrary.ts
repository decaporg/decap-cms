/**
 * This module is currently concerned only with external media libraries
 * registered via `registerMediaLibrary`.
 */
import { once } from 'lodash';
import { getMediaLibrary } from './lib/registry';
import store from './redux';
import { configFailed } from './actions/config';
import { createMediaLibrary, insertMedia } from './actions/mediaLibrary';
import { MediaLibraryInstance } from './types/redux';

type MediaLibraryOptions = {};

interface MediaLibrary {
  init: (args: {
    options: MediaLibraryOptions;
    handleInsert: (url: string) => void;
  }) => MediaLibraryInstance;
}

const initializeMediaLibrary = once(async function initializeMediaLibrary(name, options) {
  const lib = (getMediaLibrary(name) as unknown) as MediaLibrary | undefined;
  if (!lib) {
    const err = new Error(
      `Missing external media library '${name}'. Please use 'registerMediaLibrary' to register it.`,
    );
    store.dispatch(configFailed(err));
  } else {
    const handleInsert = (url: string) => store.dispatch(insertMedia(url, undefined));
    const instance = await lib.init({ options, handleInsert });
    store.dispatch(createMediaLibrary(instance));
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
