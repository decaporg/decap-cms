import type { BackendClass } from '@/lib/backend/implementation';
import type { ComponentType } from '@/lib/util/types/core';
import type { CmsBackend, CmsLocalBackend, CmsRegistryBackend } from './backend';
import type { CmsCollection } from './collections';
import type {
  CmsAllowedEvent,
  CmsEntryCodec,
  CmsEventHandler,
  CmsEventListener,
  CmsEventListenerOptions,
  CmsFormatter,
  CmsFormatterFunctions,
  CmsGetAssetFunction,
  CmsLocalePhrases,
  CmsPublishMode,
  CmsSlug,
} from './common';
import type { CmsField } from './field';
import type { CmsFieldBase } from './fields/base';
import type { CmsI18nConfig } from './i18n';
import type { CmsAssetCollection, CmsMediaLibrary, CmsMediaLibraryOptions, CmsMediaProcessing } from './media';

export interface CmsIssueReports {
  url?: string;
}

export interface CmsConfig<Backend extends CmsBackend = CmsBackend> {
  backend: Backend;
  collections: CmsCollection[];
  locale?: string;
  site_url?: string;
  display_url?: string;
  logo_url?: string; // Deprecated, replaced by `logo.src`
  logo?: {
    src: string,
    show_in_header?: boolean,
  };
  app_id?: string;
  always_fork?: boolean;
  auth_token_endpoint?: string;
  show_preview_links?: boolean;
  media_folder?: string;
  public_folder?: string;
  base_url?: string;
  site_id?: string;
  media_folder_relative?: boolean;
  media_library?: CmsMediaLibrary;
  /** Browser-side processing of uploaded images; image/file fields can override it. */
  media_processing?: CmsMediaProcessing;
  /** Named, config-defined asset groupings surfaced as sections in the media library. */
  asset_collections?: CmsAssetCollection[];
  publish_mode?: CmsPublishMode;
  load_config_file?: boolean;
  integrations?: {
    hooks: string[],
    provider: string,
    collections?: '*' | string[],
    applicationID?: string,
    apiKey?: string,
    getSignedFormURL?: string,
  }[];
  slug?: CmsSlug;
  i18n?: CmsI18nConfig;
  /**
   * Named, reusable field lists referenceable from any collection/file/
   * nested `object`/`list` field via `{ group: '<name>' }` in place of a
   * regular field entry. Expanded in place during config normalization
   * (`core/actions/config.tsx`'s `normalizeConfig`); the rest of the app
   * only ever sees plain expanded fields.
   */
  field_groups?: Record<string, CmsField[]>;
  /**
   * Named, config-defined roles: role name to list of scopes. A user whose
   * backend payload carries a matching `role` gets these scopes in addition
   * to any `scopes` the payload itself reports. Role names and their scope
   * lists are consumer data; the CMS ships no built-in roles.
   */
  roles?: Record<string, string[]>;
  issue_reports?: CmsIssueReports;
  local_backend?: boolean | CmsLocalBackend;
  editor?: {
    preview?: boolean,
    /** Default for every collection's `editor.notes`. */
    notes?: boolean,
  };
  search?: boolean;
  isFetching?: boolean;
  error?: string;
}

export interface CmsWidgetParam<T = unknown> {
  name: string;
  controlComponent: unknown;
  previewComponent?: unknown;
  globalStyles?: unknown;
}

export type CmsWidgetControlComponent = ComponentType<unknown>;

export type CmsWidgetPreviewComponent = ComponentType<unknown>;

export interface CmsWidget<T = unknown> {
  control: CmsWidgetControlComponent;
  preview?: CmsWidgetPreviewComponent;
  globalStyles?: unknown;
}

/**
 * The `t` function passed to widget controls. Structurally identical to
 * `ui-default`'s `TranslateFunction` (kept here so `lib-util` stays free of a
 * `ui-default` dependency).
 */
export type CmsWidgetTranslate = (key: string, options?: Record<string, unknown>) => string;

/**
 * Props passed to a widget's `controlComponent`. Shared, exported contract so a
 * custom widget types its control as `CmsWidgetControlProps<MyValue>` instead of
 * re-declaring the prop shape — the way upstream decap-cms exposed it. Generic
 * over the value type `T` and the field type `F`. Mirrors what core's
 * `EditorControl` passes (see the fork's own `StringControl`).
 */
export interface CmsWidgetControlProps<T = unknown, F = CmsFieldBase> {
  value?: T;
  field: F;
  onChange: (value: T) => void;
  forID?: string;
  classNameWrapper: string;
  setActiveStyle: () => void;
  setInactiveStyle: () => void;
  t: CmsWidgetTranslate;
  hasErrors?: boolean;
  errorListId?: string;
  hintId?: string;
}

/**
 * Props passed to a widget's `previewComponent`. Generic over the value type
 * `T` and field type `F`. Most previews only read `value`.
 */
export interface CmsWidgetPreviewProps<T = unknown, F = CmsFieldBase> {
  value?: T;
  field?: F;
  entry?: unknown;
  metadata?: Record<string, unknown>;
  getAsset?: CmsGetAssetFunction;
}

export type CmsWidgetValueSerializer = {
  serialize: (value: unknown) => unknown,
  deserialize: (value: unknown) => unknown,
};

export interface CmsMediaLibraryWithOptions extends CmsMediaLibrary {
  options?: CmsMediaLibraryOptions;
}

export type CmsPreviewStyle = string;

export interface CmsRegistry {
  backends: {
    [name: string]: CmsRegistryBackend,
  };
  templates: {
    [name: string]: ComponentType<unknown>,
  };
  previewStyles: CmsPreviewStyle[];
  eventHandlers: {
    [event in CmsAllowedEvent]: CmsEventHandler[];
  };
  remarkPlugins: unknown[];
  widgets: {
    [name: string]: CmsWidget,
  };
  widgetValueSerializers: {
    [name: string]: CmsWidgetValueSerializer,
  };
  mediaLibraries: CmsMediaLibraryWithOptions[];
  locales: {
    [name: string]: CmsLocalePhrases,
  };
  formats: {
    [name: string]: CmsFormatter,
  };
}

export type CmsPreviewTemplateComponentProps = {
  entry: Record<string, unknown>,
  collection: Record<string, unknown>,
  getCollection: (collectionName: string, slug?: string) => Promise<Record<string, unknown>[]>,
  widgetFor: (
    name: unknown,
    fields?: unknown,
    values?: unknown,
    fieldsMetaData?: unknown,
  ) => unknown,
  widgetsFor: (name: unknown) => unknown,
  getAsset: CmsGetAssetFunction,
  boundGetAsset: (collection: unknown, path: unknown) => CmsGetAssetFunction,
  fieldsMetaData: Record<string, unknown>,
  config: Record<string, unknown>,
  fields: Record<string, unknown>[],
  isLoadingAsset: boolean,
  window: Window,
  document: Document,
};

export interface CmsInitOptions {
  config: CmsConfig;
}

export interface CmsPreviewStyleOptions {
  raw: boolean;
}

export interface CmsCMS {
  getBackend: (name: string) => CmsRegistryBackend | undefined;
  getRemarkPlugins: () => Array<unknown>;
  getLocale: (locale: string) => CmsLocalePhrases | undefined;
  getMediaLibrary: (name: string) => CmsMediaLibrary | undefined;
  getPreviewStyles: () => CmsPreviewStyle[];
  getPreviewTemplate: (name: string) => ComponentType<CmsPreviewTemplateComponentProps> | undefined;
  getWidget: (name: string) => CmsWidget | undefined;
  getWidgetValueSerializer: (widgetName: string) => CmsWidgetValueSerializer | undefined;
  init: (options?: CmsInitOptions) => void;
  registerBackend: (name: string, backendClass: BackendClass) => void;
  registerRemarkPlugin: (plugin: unknown) => void;
  registerEventListener: (
    eventListener: CmsEventListener,
    options?: CmsEventListenerOptions,
  ) => void;
  registerLocale: (locale: string, phrases: CmsLocalePhrases) => void;
  registerMediaLibrary: (mediaLibrary: CmsMediaLibrary, options?: CmsMediaLibraryOptions) => void;
  registerPreviewStyle: (filePath: string, options?: CmsPreviewStyleOptions) => void;
  registerPreviewTemplate: (
    name: string,
    component: ComponentType<CmsPreviewTemplateComponentProps>,
  ) => void;
  registerWidget: (
    widget: string | CmsWidgetParam,
    control?: CmsWidgetControlComponent,
    preview?: CmsWidgetPreviewComponent,
  ) => void;
  registerWidgetValueSerializer: (widgetName: string, serializer: CmsWidgetValueSerializer) => void;
  resolveWidget: (name: string) => CmsWidget | undefined;
  registerCustomFormat: (name: string, extension: string, formatter: CmsFormatterFunctions) => void;
  registerEntryCodec: (pack: CmsEntryCodec) => void;
}
