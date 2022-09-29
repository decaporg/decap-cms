import type { List, Map } from 'immutable';
import type { ComponentType, FocusEventHandler, ReactNode } from 'react';
import type { t, TranslateProps as ReactPolyglotTranslateProps } from 'react-polyglot';
import type { Pluggable } from 'unified';
import type Cursor from './lib/util/Cursor';
import type { CollectionType } from './constants/collectionTypes';

export type TranslatedProps<T> = T & ReactPolyglotTranslateProps;

export type GetAssetFunction = (asset: string) => {
  url: string;
  path: string;
  field?: any;
  fileObj: File;
};

export interface CmsWidgetControlProps<T = any> {
  value: T;
  field: Map<string, any>;
  onChange: (value: T) => void;
  forID: string;
  classNameWrapper: string;
  setActiveStyle: FocusEventHandler;
  setInactiveStyle: FocusEventHandler;
  t: t;
}

export interface CmsWidgetPreviewProps<T = any> {
  value: T;
  field: Map<string, any>;
  metadata: Map<string, any>;
  getAsset: GetAssetFunction;
  entry: Map<string, any>;
  fieldsMetaData: Map<string, any>;
}

export interface CmsWidgetParam<T = any> {
  name: string;
  controlComponent: ComponentType<CmsWidgetControlProps<T>>;
  previewComponent?: ComponentType<CmsWidgetPreviewProps<T>>;
  validator?: (props: {
    field: Map<string, any>;
    value: T | undefined | null;
    t: t;
  }) => boolean | { error: any } | Promise<boolean | { error: any }>;
  globalStyles?: any;
}

export interface CmsWidget<T = any> {
  control: ComponentType<CmsWidgetControlProps<T>>;
  preview?: ComponentType<CmsWidgetPreviewProps<T>>;
  globalStyles?: any;
}

export type PreviewTemplateComponentProps = {
  entry: Map<string, any>;
  collection: Map<string, any>;
  widgetFor: (name: any, fields?: any, values?: any, fieldsMetaData?: any) => JSX.Element | null;
  widgetsFor: (name: any) => any;
  getAsset: GetAssetFunction;
  boundGetAsset: (collection: any, path: any) => GetAssetFunction;
  fieldsMetaData: Map<string, any>;
  config: Map<string, any>;
  fields: List<Map<string, any>>;
  isLoadingAsset: boolean;
  window: Window;
  document: Document;
};
export type DisplayURLObject = { id: string; path: string };

export type DisplayURL = DisplayURLObject | string;

export type DataFile = {
  path: string;
  slug: string;
  raw: string;
  newPath?: string;
};

export type AssetProxy = {
  path: string;
  fileObj?: File;
  toBase64?: () => Promise<string>;
};

export type Entry = {
  dataFiles: DataFile[];
  assets: AssetProxy[];
};

export type PersistOptions = {
  newEntry?: boolean;
  commitMessage: string;
  collectionName?: string;
  useWorkflow?: boolean;
  unpublished?: boolean;
  status?: string;
};

export type DeleteOptions = {};

export type Credentials = { token: string | {}; refresh_token?: string };

export type User = Credentials & {
  backendName?: string;
  login?: string;
  name: string;
  useOpenAuthoring?: boolean;
};

export interface ImplementationEntry {
  data: string;
  file: { path: string; label?: string; id?: string | null; author?: string; updatedOn?: string };
}

export type ImplementationFile = {
  id?: string | null | undefined;
  label?: string;
  path: string;
};
export interface ImplementationMediaFile {
  name: string;
  id: string;
  size?: number;
  displayURL?: DisplayURL;
  path: string;
  draft?: boolean;
  url?: string;
  file?: File;
}

export interface UnpublishedEntryMediaFile {
  id: string;
  path: string;
}

export interface UnpublishedEntryDiff {
  id: string;
  path: string;
  newFile: boolean;
}

export interface UnpublishedEntry {
  pullRequestAuthor?: string;
  slug: string;
  collection: string;
  status: string;
  diffs: UnpublishedEntryDiff[];
  updatedAt: string;
}

export type CursorStoreObject = {
  actions: Set<string>;
  data: Map<string, unknown>;
  meta: Map<string, unknown>;
};

export type CursorStore = {
  get<K extends keyof CursorStoreObject>(
    key: K,
    defaultValue?: CursorStoreObject[K],
  ): CursorStoreObject[K];
  getIn<V>(path: string[]): V;
  set<K extends keyof CursorStoreObject, V extends CursorStoreObject[K]>(
    key: K,
    value: V,
  ): CursorStoreObject[K];
  setIn(path: string[], value: unknown): CursorStore;
  hasIn(path: string[]): boolean;
  mergeIn(path: string[], value: unknown): CursorStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (...args: any[]) => CursorStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateIn: (...args: any[]) => CursorStore;
};

export interface Implementation {
  authComponent: () => void;
  restoreUser: (user: User) => Promise<User>;

  authenticate: (credentials: Credentials) => Promise<User>;
  logout: () => Promise<void> | void | null;
  getToken: () => Promise<string | null>;

  getEntry: (path: string) => Promise<ImplementationEntry>;
  entriesByFolder: (
    folder: string,
    extension: string,
    depth: number,
  ) => Promise<ImplementationEntry[]>;
  entriesByFiles: (files: ImplementationFile[]) => Promise<ImplementationEntry[]>;

  getMediaDisplayURL?: (displayURL: DisplayURL) => Promise<string>;
  getMedia: (folder?: string) => Promise<ImplementationMediaFile[]>;
  getMediaFile: (path: string) => Promise<ImplementationMediaFile>;

  persistEntry: (entry: Entry, opts: PersistOptions) => Promise<void>;
  persistMedia: (file: AssetProxy, opts: PersistOptions) => Promise<ImplementationMediaFile>;
  deleteFiles: (paths: string[], commitMessage: string) => Promise<void>;

  unpublishedEntries: () => Promise<string[]>;
  unpublishedEntry: (args: {
    id?: string;
    collection?: string;
    slug?: string;
  }) => Promise<UnpublishedEntry>;
  unpublishedEntryDataFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<string>;
  unpublishedEntryMediaFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<ImplementationMediaFile>;
  updateUnpublishedEntryStatus: (
    collection: string,
    slug: string,
    newStatus: string,
  ) => Promise<void>;
  publishUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  deleteUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  getDeployPreview: (
    collectionName: string,
    slug: string,
  ) => Promise<{ url: string; status: string } | null>;

  allEntriesByFolder?: (
    folder: string,
    extension: string,
    depth: number,
  ) => Promise<ImplementationEntry[]>;
  traverseCursor?: (
    cursor: Cursor,
    action: string,
  ) => Promise<{ entries: ImplementationEntry[]; cursor: Cursor }>;

  isGitBackend?: () => boolean;
  status: () => Promise<{
    auth: { status: boolean };
    api: { status: boolean; statusPage: string };
  }>;
}

export interface CmsRegistryBackend {
  init: (args: any) => Implementation;
}

export type CmsLocalePhrases = Record<string, any>; // TODO: type properly

export type CmsWidgetValueSerializer = any; // TODO: type properly

export type CmsMediaLibraryOptions = any; // TODO: type properly

export interface CmsMediaLibrary {
  name: string;
  config?: CmsMediaLibraryOptions;
}

export interface PreviewStyleOptions {
  raw: boolean;
}

export interface PreviewStyle extends PreviewStyleOptions {
  value: string;
}

export type CmsBackendType =
  | 'azure'
  | 'git-gateway'
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'test-repo'
  | 'proxy';

export type CmsMapWidgetType = 'Point' | 'LineString' | 'Polygon';

export type CmsMarkdownWidgetButton =
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'heading-four'
  | 'heading-five'
  | 'heading-six'
  | 'quote'
  | 'code-block'
  | 'bulleted-list'
  | 'numbered-list';

export interface CmsSelectWidgetOptionObject {
  label: string;
  value: any;
}

export type CmsCollectionFormatType =
  | 'yml'
  | 'yaml'
  | 'toml'
  | 'json'
  | 'frontmatter'
  | 'yaml-frontmatter'
  | 'toml-frontmatter'
  | 'json-frontmatter';

export type CmsAuthScope = 'repo' | 'public_repo';

export type CmsPublishMode = 'simple' | 'editorial_workflow';

export type CmsSlugEncoding = 'unicode' | 'ascii';

export interface CmsI18nConfig {
  structure: 'multiple_folders' | 'multiple_files' | 'single_file';
  locales: string[];
  default_locale?: string;
}

export interface CmsFieldBase {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  pattern?: [string, string];
  i18n?: boolean | 'translate' | 'duplicate' | 'none';
  media_folder?: string;
  public_folder?: string;
  comment?: string;
}

export interface CmsFieldBoolean {
  widget: 'boolean';
  default?: boolean;
}

export interface CmsFieldCode {
  widget: 'code';
  default?: any;

  default_language?: string;
  allow_language_selection?: boolean;
  keys?: { code: string; lang: string };
  output_code_only?: boolean;
}

export interface CmsFieldColor {
  widget: 'color';
  default?: string;

  allowInput?: boolean;
  enableAlpha?: boolean;
}

export interface CmsFieldDateTime {
  widget: 'datetime';
  default?: string;

  format?: string;
  date_format?: boolean | string;
  time_format?: boolean | string;
  picker_utc?: boolean;

  /**
   * @deprecated Use date_format instead
   */
  dateFormat?: boolean | string;
  /**
   * @deprecated Use time_format instead
   */
  timeFormat?: boolean | string;
  /**
   * @deprecated Use picker_utc instead
   */
  pickerUtc?: boolean;
}

export interface CmsFieldFileOrImage {
  widget: 'file' | 'image';
  default?: string;

  media_library?: CmsMediaLibrary;
  allow_multiple?: boolean;
  config?: any;
}

export interface CmsFieldObject {
  widget: 'object';
  default?: any;

  collapsed?: boolean;
  summary?: string;
  fields: CmsField[];
}

export interface CmsFieldList {
  widget: 'list';
  default?: any;

  allow_add?: boolean;
  collapsed?: boolean;
  summary?: string;
  minimize_collapsed?: boolean;
  label_singular?: string;
  field?: CmsField;
  fields?: CmsField[];
  max?: number;
  min?: number;
  add_to_top?: boolean;
  types?: (CmsFieldBase & CmsFieldObject)[];
}

export interface CmsFieldMap {
  widget: 'map';
  default?: string;

  decimals?: number;
  type?: CmsMapWidgetType;
}

export interface CmsFieldMarkdown {
  widget: 'markdown';
  default?: string;

  minimal?: boolean;
  buttons?: CmsMarkdownWidgetButton[];
  editor_components?: string[];
  modes?: ('raw' | 'rich_text')[];

  /**
   * @deprecated Use editor_components instead
   */
  editorComponents?: string[];
}

export interface CmsFieldNumber {
  widget: 'number';
  default?: string | number;

  value_type?: 'int' | 'float' | string;
  min?: number;
  max?: number;

  step?: number;

  /**
   * @deprecated Use valueType instead
   */
  valueType?: 'int' | 'float' | string;
}

export interface CmsFieldSelect {
  widget: 'select';
  default?: string | string[];

  options: string[] | CmsSelectWidgetOptionObject[];
  multiple?: boolean;
  min?: number;
  max?: number;
}

export interface CmsFieldRelation {
  widget: 'relation';
  default?: string | string[];

  collection: string;
  value_field: string;
  search_fields: string[];
  file?: string;
  display_fields?: string[];
  multiple?: boolean;
  options_length?: number;

  /**
   * @deprecated Use value_field instead
   */
  valueField?: string;
  /**
   * @deprecated Use search_fields instead
   */
  searchFields?: string[];
  /**
   * @deprecated Use display_fields instead
   */
  displayFields?: string[];
  /**
   * @deprecated Use options_length instead
   */
  optionsLength?: number;
}

export interface CmsFieldHidden {
  widget: 'hidden';
  default?: any;
}

export interface CmsFieldStringOrText {
  // This is the default widget, so declaring its type is optional.
  widget?: 'string' | 'text';
  default?: string;
}

export interface CmsFieldMeta {
  name: string;
  label: string;
  widget: string;
  required: boolean;
  index_file: string;
  meta: boolean;
}

export type CmsField = CmsFieldBase &
  (
    | CmsFieldBoolean
    | CmsFieldCode
    | CmsFieldColor
    | CmsFieldDateTime
    | CmsFieldFileOrImage
    | CmsFieldList
    | CmsFieldMap
    | CmsFieldMarkdown
    | CmsFieldNumber
    | CmsFieldObject
    | CmsFieldRelation
    | CmsFieldSelect
    | CmsFieldHidden
    | CmsFieldStringOrText
    | CmsFieldMeta
  );

export interface CmsCollectionFile {
  name: string;
  label: string;
  file: string;
  fields: CmsField[];
  label_singular?: string;
  description?: string;
  preview_path?: string;
  preview_path_date_field?: string;
  i18n?: boolean | CmsI18nConfig;
  media_folder?: string;
  public_folder?: string;
  editor?: {
    preview?: boolean;
  };
}

export interface ViewFilter {
  id: string;
  label: string;
  field: string;
  pattern: string;
}

export interface ViewGroup {
  id: string;
  label: string;
  field: string;
  pattern?: string;
}

export enum SortDirection {
  Ascending = 'Ascending',
  Descending = 'Descending',
  None = 'None',
}

export interface CmsSortableFieldsDefault {
  field: string;
  direction: SortDirection;
}

export interface CmsSortableFields {
  default?: CmsSortableFieldsDefault;
  fields: string[];
}

export interface CmsCollection {
  name: string;
  type?: CollectionType;
  icon?: string;
  label: string;
  label_singular?: string;
  description?: string;
  folder?: string;
  files?: CmsCollectionFile[];
  identifier_field?: string;
  summary?: string;
  slug?: string;
  preview_path?: string;
  preview_path_date_field?: string;
  create?: boolean;
  delete?: boolean;
  hide?: boolean;
  editor?: {
    preview?: boolean;
  };
  publish?: boolean;
  nested?: {
    depth: number;
  };
  meta?: { path?: { label: string; widget: string; index_file: string } };

  /**
   * It accepts the following values: yml, yaml, toml, json, md, markdown, html
   *
   * You may also specify a custom extension not included in the list above, by specifying the format value.
   */
  extension?: string;
  format?: CmsCollectionFormatType;

  frontmatter_delimiter?: string[] | string;
  fields?: CmsField[];
  filter?: { field: string; value: any };
  path?: string;
  media_folder?: string;
  public_folder?: string;
  sortable_fields?: CmsSortableFields;
  view_filters?: ViewFilter[];
  view_groups?: ViewGroup[];
  i18n?: boolean | CmsI18nConfig;
}

export interface CmsBackend {
  name: CmsBackendType;
  auth_scope?: CmsAuthScope;
  open_authoring?: boolean;
  always_fork?: boolean;
  repo?: string;
  branch?: string;
  api_root?: string;
  site_domain?: string;
  base_url?: string;
  auth_endpoint?: string;
  app_id?: string;
  auth_type?: 'implicit' | 'pkce';
  cms_label_prefix?: string;
  squash_merges?: boolean;
  proxy_url?: string;
  commit_messages?: {
    create?: string;
    update?: string;
    delete?: string;
    uploadMedia?: string;
    deleteMedia?: string;
    openAuthoring?: string;
  };
}

export interface CmsSlug {
  encoding?: CmsSlugEncoding;
  clean_accents?: boolean;
  sanitize_replacement?: string;
}

export interface CmsLocalBackend {
  url?: string;
  allowed_hosts?: string[];
}

export interface CmsConfig {
  backend: CmsBackend;
  collections: CmsCollection[];
  locale?: string;
  site_url?: string;
  display_url?: string;
  logo_url?: string;
  show_preview_links?: boolean;
  media_folder?: string;
  public_folder?: string;
  media_folder_relative?: boolean;
  media_library?: CmsMediaLibrary;
  publish_mode?: CmsPublishMode;
  load_config_file?: boolean;
  integrations?: {
    hooks: string[];
    provider: string;
    collections?: '*' | string[];
    applicationID?: string;
    apiKey?: string;
    getSignedFormURL?: string;
  }[];
  slug?: CmsSlug;
  i18n?: CmsI18nConfig;
  local_backend?: boolean | CmsLocalBackend;
  editor?: {
    preview?: boolean;
  };
  search?: boolean;
}

export interface InitOptions {
  config: CmsConfig;
}

export type CmsBackendClass = Implementation;

export interface EditorComponentField {
  name: string;
  label: string;
  widget: string;
}

export interface EditorComponentWidgetOptions {
  id: string;
  label: string;
  widget: string;
  type: string;
}

export interface EditorComponentManualOptions {
  id: string;
  label: string;
  fields: EditorComponentField[];
  pattern: RegExp;
  allow_add?: boolean;
  fromBlock: (match: RegExpMatchArray) => any;
  toBlock: (data: any) => string;
  toPreview: (data: any) => string;
}

export type EditorComponentOptions = EditorComponentManualOptions | EditorComponentWidgetOptions;

export interface CmsEventListener {
  name: 'prePublish' | 'postPublish' | 'preUnpublish' | 'postUnpublish' | 'preSave' | 'postSave';
  handler: ({
    entry,
    author,
  }: {
    entry: Map<string, any>;
    author: { login: string; name: string };
  }) => any;
}

export type CmsEventListenerOptions = any; // TODO: type properly

export interface CMSApi {
  getBackend: (name: string) => CmsRegistryBackend | undefined;
  getEditorComponents: () => Map<string, ComponentType<any>>;
  getRemarkPlugins: () => Array<Pluggable>;
  getLocale: (locale: string) => CmsLocalePhrases | undefined;
  getMediaLibrary: (name: string) => CmsMediaLibrary | undefined;
  resolveWidget: (name: string) => CmsWidget | undefined;
  getPreviewStyles: () => PreviewStyle[];
  getPreviewTemplate: (name: string) => ComponentType<PreviewTemplateComponentProps> | undefined;
  getWidget: (name: string) => CmsWidget | undefined;
  getWidgetValueSerializer: (widgetName: string) => CmsWidgetValueSerializer | undefined;
  init: (options?: InitOptions) => void;
  registerBackend: <T extends CmsBackendClass>(name: string, backendClass: T) => void;
  registerEditorComponent: (options: EditorComponentOptions) => void;
  registerRemarkPlugin: (plugin: Pluggable) => void;
  registerEventListener: (
    eventListener: CmsEventListener,
    options?: CmsEventListenerOptions,
  ) => void;
  registerLocale: (locale: string, phrases: CmsLocalePhrases) => void;
  registerMediaLibrary: (mediaLibrary: CmsMediaLibrary, options?: CmsMediaLibraryOptions) => void;
  registerPreviewStyle: (filePath: string, options?: PreviewStyleOptions) => void;
  registerPreviewTemplate: (
    name: string,
    component: ComponentType<PreviewTemplateComponentProps>,
  ) => void;
  registerWidget: (
    widget: string | CmsWidgetParam | CmsWidgetParam[],
    control?: ComponentType<CmsWidgetControlProps> | string,
    preview?: ComponentType<CmsWidgetPreviewProps>,
  ) => void;
  registerWidgetValueSerializer: (widgetName: string, serializer: CmsWidgetValueSerializer) => void;
  registerIcon: (iconName: string, icon: ReactNode) => void;
  getIcon: (iconName: string) => ReactNode;
  registerAdditionalLink: (id: string, title: string, link: string, iconName?: string) => void;
  getAdditionalLinks: () => { title: string; link: string; iconName?: string }[];
}
