import { Action } from 'redux';
import { StaticallyTypedRecord } from './immutable';
import { Map, List } from 'immutable';
import AssetProxy from '../valueObjects/AssetProxy';
import { ImplementationMediaFile } from 'netlify-cms-lib-util';

export type SlugConfig = StaticallyTypedRecord<{
  encoding: string;
  clean_accents: boolean;
  sanitize_replacement: string;
}>;

type BackendObject = {
  name: string;
  repo?: string | null;
  open_authoring?: boolean;
  branch?: string;
  api_root?: string;
  squash_merges?: boolean;
  use_graphql?: boolean;
  preview_context?: string;
  identity_url?: string;
  gateway_url?: string;
  large_media_url?: string;
  use_large_media_transforms_in_media_library?: boolean;
};

type Backend = StaticallyTypedRecord<Backend> & BackendObject;

export type Config = StaticallyTypedRecord<{
  backend: Backend;
  media_folder: string;
  public_folder: string;
  publish_mode?: string;
  media_library: StaticallyTypedRecord<{ name: string }> & { name: string };
  locale?: string;
  slug: SlugConfig;
  media_folder_relative?: boolean;
  base_url?: string;
  site_id?: string;
  site_url?: string;
  show_preview_links?: boolean;
}>;

type PagesObject = {
  [collection: string]: { isFetching: boolean; page: number; ids: List<string> };
};

type Pages = StaticallyTypedRecord<PagesObject>;

type EntitiesObject = { [key: string]: EntryMap };

export type Entities = StaticallyTypedRecord<EntitiesObject>;

export type Entries = StaticallyTypedRecord<{
  pages: Pages & PagesObject;
  entities: Entities & EntitiesObject;
}>;

export type Deploys = StaticallyTypedRecord<{}>;

export type EditorialWorkflow = StaticallyTypedRecord<{
  pages: Pages & PagesObject;
  entities: Entities & EntitiesObject;
}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EntryObject = {
  path: string;
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  collection: string;
  mediaFiles: List<MediaFileMap>;
  newRecord: boolean;
  metaData: { status: string };
};

export type EntryMap = StaticallyTypedRecord<EntryObject>;

export type Entry = EntryMap & EntryObject;

export type FieldsErrors = StaticallyTypedRecord<{ [field: string]: { type: string }[] }>;

export type EntryDraft = StaticallyTypedRecord<{
  entry: Entry;
  fieldsErrors: FieldsErrors;
}>;

export type EntryField = StaticallyTypedRecord<{
  field?: EntryField;
  fields?: List<EntryField>;
  widget: string;
  name: string;
  default: string | null;
}>;

export type EntryFields = List<EntryField>;

export type FilterRule = StaticallyTypedRecord<{
  value: string;
  field: string;
}>;

export type CollectionFile = StaticallyTypedRecord<{
  file: string;
  name: string;
  fields: EntryFields;
  label: string;
}>;

export type CollectionFiles = List<CollectionFile>;

type CollectionObject = {
  name: string;
  folder?: string;
  files?: CollectionFiles;
  fields: EntryFields;
  isFetching: boolean;
  media_folder?: string;
  public_folder?: string;
  preview_path?: string;
  preview_path_date_field?: string;
  summary?: string;
  filter?: FilterRule;
  type: 'file_based_collection' | 'folder_based_collection';
  extension?: string;
  format?: string;
  create?: boolean;
  delete?: boolean;
  identifier_field?: string;
  path?: string;
};

export type Collection = StaticallyTypedRecord<CollectionObject>;

export type Collections = StaticallyTypedRecord<{ [path: string]: Collection & CollectionObject }>;

export type Medias = StaticallyTypedRecord<{ [path: string]: AssetProxy | undefined }>;

export interface MediaLibraryInstance {
  show: (args: {
    id?: string;
    value?: string;
    config: StaticallyTypedRecord<{}>;
    allowMultiple?: boolean;
    imagesOnly?: boolean;
  }) => void;
  hide: () => void;
  onClearControl: (args: { id: string }) => void;
  onRemoveControl: (args: { id: string }) => void;
  enableStandalone: () => boolean;
}

export type DisplayURL = { id: string; path: string } | string;

export type MediaFile = ImplementationMediaFile & { key?: string };

export type MediaFileMap = StaticallyTypedRecord<MediaFile>;

type DisplayURLStateObject = {
  isFetching: boolean;
  url?: string;
  err?: Error;
};

export type DisplayURLState = StaticallyTypedRecord<DisplayURLStateObject>;

interface DisplayURLsObject {
  [id: string]: DisplayURLState;
}

export type MediaLibrary = StaticallyTypedRecord<{
  externalLibrary?: MediaLibraryInstance;
  files: MediaFile[];
  displayURLs: StaticallyTypedRecord<DisplayURLsObject> & DisplayURLsObject;
  isLoading: boolean;
}>;

export type Hook = string | boolean;

export type Integrations = StaticallyTypedRecord<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hooks: { [collectionOrHook: string]: any };
}>;

interface SearchItem {
  collection: string;
  slug: string;
}

export type Search = StaticallyTypedRecord<{ entryIds?: SearchItem[] }>;

export type Cursors = StaticallyTypedRecord<{}>;

export interface State {
  config: Config;
  cursors: Cursors;
  collections: Collections;
  deploys: Deploys;
  editorialWorkflow: EditorialWorkflow;
  entries: Entries;
  entryDraft: EntryDraft;
  integrations: Integrations;
  medias: Medias;
  mediaLibrary: MediaLibrary;
  search: Search;
}

export interface MediasAction extends Action<string> {
  payload: string | AssetProxy | AssetProxy[];
}

export interface ConfigAction extends Action<string> {
  payload: Map<string, boolean>;
}

export interface Integration {
  hooks: string[];
  collections?: string | string[];
  provider: string;
}

export interface IntegrationsAction extends Action<string> {
  payload: StaticallyTypedRecord<{
    integrations: List<Integration>;
    collections: StaticallyTypedRecord<{ name: string }>[];
  }>;
}

interface EntryPayload {
  collection: string;
}

export interface EntryRequestPayload extends EntryPayload {
  slug: string;
}

export interface EntrySuccessPayload extends EntryPayload {
  entry: EntryObject;
}

export interface EntryFailurePayload extends EntryPayload {
  slug: string;
  error: Error;
}

export interface EntryDeletePayload {
  entrySlug: string;
  collectionName: string;
}

export type EntriesRequestPayload = EntryPayload;

export interface EntriesSuccessPayload extends EntryPayload {
  entries: EntryObject[];
  append: boolean;
  page: number;
}

export interface EntriesAction extends Action<string> {
  payload:
    | EntryRequestPayload
    | EntrySuccessPayload
    | EntryFailurePayload
    | EntriesSuccessPayload
    | EntriesRequestPayload
    | EntryDeletePayload;
  meta: {
    collection: string;
  };
}

export interface CollectionsAction extends Action<string> {
  payload?: StaticallyTypedRecord<{ collections: List<Collection> }>;
}

export interface EditorialWorkflowAction extends Action<string> {
  payload?: StaticallyTypedRecord<{ publish_mode: string }> & {
    collection: string;
    entry: { slug: string };
  } & {
    collection: string;
    slug: string;
  } & {
    pages: [];
    entries: { collection: string; slug: string }[];
  } & {
    collection: string;
    entry: StaticallyTypedRecord<{ slug: string }>;
  } & {
    collection: string;
    slug: string;
    newStatus: string;
  };
}

export interface MediaLibraryAction extends Action<string> {
  payload: MediaLibraryInstance & {
    controlID: string;
    forImage: boolean;
    privateUpload: boolean;
    config: Map<string, string>;
  } & { mediaPath: string | string[] } & { page: number } & {
    files: MediaFile[];
    page: number;
    canPaginate: boolean;
    dynamicSearch: boolean;
    dynamicSearchQuery: boolean;
  } & {
    file: MediaFile;
    privateUpload: boolean;
  } & {
    file: { id: string; key: string; privateUpload: boolean };
  } & { key: string } & { url: string } & { err: Error };
}
