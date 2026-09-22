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

/**
 * The user fields an external media library may see. Deliberately built by
 * picking named fields off the auth user rather than by deleting sensitive
 * ones, so a backend that starts returning a new credential does not leak it
 * here by default.
 */
type MediaLibraryContextUser = {
  id?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

/**
 * The contract handed to every library registered via `registerMediaLibrary`.
 *
 * `registerMediaLibrary` is a public extension point — libraries are loaded
 * from arbitrary script tags — so everything here is effectively given to
 * untrusted third-party code. Treat it as a minimum, not as a convenient place
 * to expose state.
 *
 * - `token` is the short-lived access token; passing it is the reason this
 *   contract exists.
 * - `backendConfig` is passed whole on purpose. It is the site's own
 *   `config.yml` `backend` block, which Decap already serves publicly from
 *   `/admin/config.yml`, so fields like `supabase_anon_key` and
 *   `turbo_config_url` are public by construction, not secrets. Libraries read
 *   arbitrary keys off it (`base_url`, `turbo_site_id`, ...), so narrowing it
 *   would break them for no security gain.
 * - `user` is a picked, token-free shape. Never pass `state.auth.user` itself:
 *   for the Turbo backends it carries `access_token`, `refresh_token` and
 *   `expires_at`.
 *
 * This type is hand-duplicated as `MediaLibraryContext` in
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

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function pickContextUser(value: unknown): MediaLibraryContextUser | undefined {
  if (!value) {
    return undefined;
  }

  const user = toPlainObject(value);
  const picked: MediaLibraryContextUser = {
    id: asString(user.id),
    email: asString(user.email) || asString(user.user_email),
    name: asString(user.name) || asString(user.user_name) || asString(user.login),
    avatarUrl: asString(user.avatarUrl) || asString(user.avatar_url),
  };

  return Object.fromEntries(
    Object.entries(picked).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as MediaLibraryContextUser;
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

  // Passed whole on purpose — see the note on `MediaLibraryContext`. This is
  // the publicly served `config.yml` backend block, not secret state.
  const backendConfig = toPlainObject(state.config?.backend);

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
