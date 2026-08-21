/**
 * This module is currently concerned only with external media libraries
 * registered via `registerMediaLibrary`.
 */
import once from 'lodash/once';

import { getMediaLibrary } from './lib/registry';
import { currentBackend } from './backend';
import { store } from './redux';
import { configFailed } from './actions/config';
import { createMediaLibrary, insertMedia } from './actions/mediaLibrary';

import type { MediaLibraryInstance } from './types/redux';

type MediaLibraryOptions = {};

type MediaLibraryContext = {
  backendName?: string;
  backendConfig?: Record<string, unknown>;
  authUser?: Record<string, unknown>;
  token?: string;
  activeSiteId?: string;
};

interface MediaLibrary {
  init: (args: {
    options: MediaLibraryOptions;
    handleInsert: (url: string) => void;
    getMediaLibraryContext?: () => Promise<MediaLibraryContext>;
  }) => MediaLibraryInstance;
}

function toPlainObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const maybeImmutable = value as { toJS?: () => unknown };
  if (typeof maybeImmutable.toJS === 'function') {
    const plain = maybeImmutable.toJS();
    return plain && typeof plain === 'object' ? (plain as Record<string, unknown>) : {};
  }

  return value as Record<string, unknown>;
}

async function getMediaLibraryContext(): Promise<MediaLibraryContext> {
  const state = store.getState();
  if (!state) {
    return {};
  }

  const backend = currentBackend(state.config);

  let token: string | undefined;
  try {
    token = (await backend.getToken()) || undefined;
  } catch (error) {
    token = undefined;
  }

  const backendConfig = toPlainObject(state.config?.backend);

  const authUser = state.auth?.user
    ? (state.auth.user as unknown as Record<string, unknown>)
    : undefined;

  return {
    backendName: backendConfig?.name as string | undefined,
    backendConfig,
    authUser,
    token,
    activeSiteId: (backendConfig?.turbo_site_id as string | undefined) || undefined,
  };
}

function handleInsert(url: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return store.dispatch(insertMedia(url, undefined));
}

const initializeMediaLibrary = once(async function initializeMediaLibrary(name, options) {
  const lib = getMediaLibrary(name) as unknown as MediaLibrary | undefined;
  if (!lib) {
    const err = new Error(
      `Missing external media library '${name}'. Please use 'registerMediaLibrary' to register it.`,
    );
    store.dispatch(configFailed(err));
  } else {
    const instance = await lib.init({ options, handleInsert, getMediaLibraryContext });
    store.dispatch(createMediaLibrary(instance));
  }
});

store.subscribe(() => {
  const state = store.getState();
  if (state) {
    const mediaLibraryName = state.config.media_library?.name;
    if (mediaLibraryName && !state.mediaLibrary.get('externalLibrary')) {
      const mediaLibraryConfig = state.config.media_library;
      initializeMediaLibrary(mediaLibraryName, mediaLibraryConfig);
    }
  }
});
