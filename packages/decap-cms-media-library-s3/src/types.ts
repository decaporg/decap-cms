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

export interface MediaLibraryContext {
  backendName?: string;
  backendConfig?: Record<string, unknown>;
  authUser?: Record<string, unknown>;
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
