/**
 * This module is currently concerned only with external media libraries
 * registered via `registerMediaLibrary`.
 */
import { once } from 'lodash';
import { getMediaLibrary } from './lib/registry';
import store from './redux';
import { createMediaLibrary, insertMedia } from './actions/mediaLibrary';

type MediaLibraryOptions = {};

interface MediaLibrary {
  init: (args: {
    options: MediaLibraryOptions;
    handleInsert: (url: string) => void;
  }) => MediaLibraryInstance;
}

export interface MediaLibraryInstance {
  show?: () => void;
  hide?: () => void;
  onClearControl?: (args: { id: string }) => void;
  onRemoveControl?: (args: { id: string }) => void;
  enableStandalone?: () => boolean;
}

const initializeMediaLibrary = once(async function initializeMediaLibrary(name, options) {
  const lib = (getMediaLibrary(name) as unknown) as MediaLibrary;
  const handleInsert = (url: string) => store.dispatch(insertMedia(url));
  const instance = await lib.init({ options, handleInsert });
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
