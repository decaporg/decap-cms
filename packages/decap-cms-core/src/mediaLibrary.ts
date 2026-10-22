/**
 * This module is currently concerned only with external media libraries
 * registered via `registerMediaLibrary`.
 */
import once from 'lodash/once';
import pick from 'lodash/pick';

import { getMediaLibrary } from './lib/registry';
import { currentBackend } from './backend';
import { store } from './redux';
import { configFailed } from './actions/config';
import { createMediaLibrary, insertMedia } from './actions/mediaLibrary';

import type { MediaLibraryInstance } from './types/redux';

type MediaLibraryOptions = {};

/** Picked by name, not by deleting secrets, so a new credential field never leaks here. */
type MediaLibraryContextUser = {
  id?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

/**
 * The contract handed to every library registered via `registerMediaLibrary`,
 * which is untrusted third-party code: treat it as a minimum.
 *
 * - `token`: the short-lived access token, the reason this contract exists.
 * - `backendConfig`: whole on purpose; it is the publicly served `config.yml` block.
 * - `user`: picked and token-free. Never `state.auth.user`, which carries tokens.
 *
 * Hand-duplicated as `MediaLibraryContext` in
 * `packages/decap-cms-media-library-s3/src/types.ts` (that package cannot
 * import types from core). Keep the two identical.
 */
type MediaLibraryContext = {
  backendName?: string;
  backendConfig?: Record<string, unknown>;
  user?: MediaLibraryContextUser;
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

function pickContextUser(user: unknown): MediaLibraryContextUser | undefined {
  if (!user) {
    return undefined;
  }

  const plain = (user as { toJS?: () => unknown }).toJS?.() ?? user;
  const { avatar_url: avatarUrl, ...picked } = pick(plain as Record<string, string>, [
    'id',
    'email',
    'name',
    'avatar_url',
  ]);
  return avatarUrl === undefined ? picked : { ...picked, avatarUrl };
}

export async function getMediaLibraryContext(): Promise<MediaLibraryContext> {
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

  // Passed whole on purpose; see `MediaLibraryContext`.
  const backendConfig: Record<string, unknown> = { ...state.config?.backend };

  return {
    backendName: backendConfig?.name as string | undefined,
    backendConfig,
    user: pickContextUser(state.auth?.user),
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
