/**
 * S3-compatible Storage API Types
 */

// A single entry in a ListObjectsV2 response: either an object (Contents)
// or an emulated "folder" (CommonPrefixes, derived from the delimiter).
export interface S3File {
  Key: string;
  Size: number;
  LastModified: string;
  ETag: string;
  IsDirectory: boolean;
  // Just the last path segment, mirroring Bunny's ObjectName field so the
  // shared UI components (FileGrid, FileBrowser) don't need to know about
  // full-key vs. path-segment naming differences between providers.
  ObjectName: string;
}

export interface S3Config {
  public_url_prefix: string;
  root_path?: string;
  max_file_size?: number;
  multiple?: boolean;
}

/**
 * The user fields an external media library may see. Deliberately built by
 * picking named fields off the auth user rather than by deleting sensitive
 * ones, so a backend that starts returning a new credential does not leak it
 * here by default.
 */
export interface MediaLibraryContextUser {
  id?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

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
 * - `user` is a picked, token-free shape. It never carries `access_token`,
 *   `refresh_token` or `expires_at`.
 *
 * This type is hand-duplicated from `MediaLibraryContext` in
 * `packages/decap-cms-core/src/mediaLibrary.ts`, which is where core builds it
 * (this package cannot import types from core). Keep the two identical.
 */
export interface MediaLibraryContext {
  backendName?: string;
  backendConfig?: Record<string, unknown>;
  user?: MediaLibraryContextUser;
  token?: string;
  activeSiteId?: string;
}

export interface S3IntegrationOptions {
  config: S3Config;
  images_only?: boolean;
}

export interface S3InitOptions {
  options?: S3IntegrationOptions & Record<string, unknown>;
  handleInsert?: (value: string | string[]) => void;
  getMediaLibraryContext?: () => Promise<MediaLibraryContext>;
}

export interface MediaLibraryInstance {
  show: (args?: {
    id?: string;
    value?: string | string[];
    config?: Record<string, unknown>;
    allowMultiple?: boolean;
    imagesOnly?: boolean;
  }) => void;
  hide: () => void;
  onClearControl?: (args: { id: string }) => void;
  onRemoveControl?: (args: { id: string }) => void;
  enableStandalone: () => boolean;
}

export interface S3MediaLibrary {
  name: 's3';
  init: (options: S3InitOptions) => Promise<MediaLibraryInstance>;
}

export interface AddressedMediaFile extends S3File {
  publicUrl: string;
}
