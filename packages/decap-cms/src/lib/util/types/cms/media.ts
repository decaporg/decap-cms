import type { CmsDisplayURL } from './common.js';
import type { CmsEntryField } from './entries.js';

/**
 * Opt-in client-side raster image optimization applied at upload time,
 * before the file is handed to the backend. Resolution order (most to
 * least specific): field-level `media_library.config.image_optimization`,
 * then the global `media_library.config.image_optimization`.
 */
export type CmsImageOptimizationConfig = {
  /** Master switch; defaults to `false` (opt-in). */
  enabled?: boolean | undefined,
  /** Max output width in px; the image is scaled down to fit, preserving aspect ratio. */
  max_width?: number | undefined,
  /** Max output height in px; the image is scaled down to fit, preserving aspect ratio. */
  max_height?: number | undefined,
  /** Output format. `'original'` keeps the source format but still resizes. */
  format?: 'webp' | 'jpeg' | 'png' | 'original' | undefined,
  /** Encoder quality in the 0-1 range; ignored for lossless formats like png. */
  quality?: number | undefined,
};

/**
 * Opt-in interactive crop/resize step shown before an uploaded raster image
 * is handed to the backend (DCMS-2011, split from the on-upload
 * *automatic* optimization in `CmsImageOptimizationConfig`/DCMS-1397: that
 * one silently downscales every upload, this one lets the user pick the
 * crop region themselves). Resolution order matches
 * `CmsImageOptimizationConfig`: field-level `media_library.config.crop`
 * wins over the site-wide `media_library.config.crop` default.
 */
export type CmsImageCropConfig = {
  /** Master switch; defaults to `false` (opt-in). */
  enabled?: boolean | undefined,
  /**
   * Locks the crop selection to this width/height ratio (e.g. `1` for a
   * square, `16 / 9` for widescreen). Omitted means free-form cropping.
   */
  aspect_ratio?: number | undefined,
};

export type CmsMediaLibraryOptions = {
  multiple?: boolean | undefined,
  max_file_size?: number | undefined,
  image_optimization?: CmsImageOptimizationConfig | undefined,
  crop?: CmsImageCropConfig | undefined,
};

export interface CmsMediaLibrary {
  name: string;
  config?: CmsMediaLibraryOptions;
  allow_multiple?: boolean | undefined;
}

// Mirrors `MediaFile` in `src/core/backend.tsx`: assembled from backend media
// payloads that report these fields inconsistently, so an explicit `undefined`
// means "not reported".
export interface CmsBackendMediaFile {
  name: string;
  id: string;
  size?: number | undefined;
  displayURL?: CmsDisplayURL | undefined;
  path: string;
  draft?: boolean | undefined;
  url?: string | undefined;
  file?: File | undefined;
  field?: CmsEntryField | undefined;
  /**
   * Set when this entry represents a folder rather than an asset. Only
   * populated when `folderSupport` was requested from a backend that can
   * list directory entries alongside files; other backends (or calls
   * without `folderSupport`) simply never set it, so consumers should treat
   * its absence the same as `false`.
   */
  isDirectory?: boolean | undefined;
}

export type CmsMediaFile = CmsBackendMediaFile & { key?: string | undefined };

export type CmsMediaFileMap = CmsMediaFile;

export type CmsImplementationMediaFile = {
  name: string,
  id: string,
  size?: number | undefined,
  displayURL?: CmsDisplayURL | undefined,
  path: string,
  draft?: boolean | undefined,
  url?: string | undefined,
  file?: File | undefined,
  /** See `CmsBackendMediaFile.isDirectory`. */
  isDirectory?: boolean | undefined,
};

/**
 * What a backend's paginated media surface supports. Returned by
 * `BackendImplementation.getMediaCapabilities`; only consulted when the backend
 * also implements `getMediaPage`.
 */
export type CmsMediaCapabilities = {
  /** Media can be listed page by page via `getMediaPage`. */
  pagination: boolean,
  /**
   * `getMediaPage({ query })` applies the search server-side. When false the
   * media library falls back to client-side filtering of loaded pages.
   */
  dynamicSearch: boolean,
};

export type CmsGetMediaPageOptions = {
  /** Opaque continuation from the previous page's `nextCursor`; omit for the first page. */
  cursor?: string,
  /** Server-side search term; only passed when capabilities declare dynamicSearch. */
  query?: string,
  /** Requested page size; backends may return slightly more or fewer items. */
  perPage?: number,
  /**
   * When true, backends that distinguish files from directories should
   * surface directory entries (`isDirectory: true`) instead of flattening
   * them, mirroring `BackendImplementation.getMedia`'s `folderSupport` param.
   * Backends that don't support this keep their current flattened behavior.
   */
  folderSupport?: boolean,
};

export type CmsMediaPage = {
  files: CmsImplementationMediaFile[],
  /** Continuation for the next page; absent when the listing is exhausted. */
  nextCursor?: string,
};

/**
 * Config-defined, named group of assets, surfaced as a section in the media
 * library (mirrors entry `collections`, minus anything entry-specific). See
 * `getConfigSchema`'s `asset_collections` for the validated shape and
 * `docs/core/asset-collections.md` for user-facing docs.
 */
export interface CmsAssetCollection {
  name: string;
  label: string;
  label_singular?: string;
  description?: string;
  /** Folder this collection's assets live in; also scopes uploads made while it's selected. */
  media_folder: string;
  public_folder?: string;
  /** Extensions (without the leading dot) accepted for this collection; unset allows any type. */
  allowed_file_types?: string[];
  /**
   * Slug-template (reuses the entry `slug`/`media_folder` template engine,
   * `compileStringTemplate`) applied to the sanitized upload filename on
   * persist, e.g. `{{entry_slug}}-{{index}}.{{extension}}`. The template
   * produces the whole filename, so it must include `{{extension}}` (or a
   * literal extension) itself. Supports the standard placeholders
   * (`{{year}}`, `{{month}}`, `{{filename}}`, `{{extension}}`, `{{slug}}`
   * meaning the original filename's basename, ...) plus two asset-collection
   * specific ones: `{{entry_slug}}` (the entry the upload was made from, when
   * any) and `{{index}}`, a 1-based counter that increments until the
   * resolved filename is unique among the collection's existing files.
   */
  filename_template?: string;
}

export interface CmsMediaLibraryInstance {
  show: (args: {
    id?: string,
    value?: string,
    config: Record<string, unknown>,
    allowMultiple?: boolean,
    imagesOnly?: boolean,
  }) => void;
  hide: () => void;
  onClearControl: (args: { id: string }) => void;
  onRemoveControl: (args: { id: string }) => void;
  enableStandalone: () => boolean;
}

/** Output format for `media_processing.format`. */
export type CmsMediaProcessingFormat = 'jpeg' | 'webp';

/**
 * Browser-side processing applied once to an uploaded image (JPEG, PNG or
 * WebP; SVG is never processed) before it is stored. Set globally or on an
 * image/file field, which then overrides the global setting.
 */
export interface CmsMediaProcessing {
  enabled: boolean;
  /** Convert to this format; when disabled the original format is kept. */
  format?: {
    enabled: boolean,
    default: CmsMediaProcessingFormat,
  };
  /** Encoding quality, 1-100. */
  quality?: number;
  /** Re-encode the image, which drops its metadata (EXIF and the like). */
  strip_metadata?: boolean;
  width?: number | null;
  height?: number | null;
  /** Crop to this aspect ratio: a number or `16_9`, `16:9`, `16x9`. */
  aspect_ratio?: number | string | null;
}
