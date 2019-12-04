import { Action } from 'redux';
import { StaticallyTypedRecord } from './immutable';
import { Map, List } from 'immutable';
import AssetProxy from '../valueObjects/AssetProxy';

export type Config = StaticallyTypedRecord<{
  media_folder: string;
  public_folder: string;
  publish_mode?: string;
  media_library: StaticallyTypedRecord<{ name: string }> & { name: string };
  locale?: string;
  slug?: Map<string, string | boolean>;
  media_folder_relative?: boolean;
}>;

type PagesObject = {
  [collection: string]: { isFetching: boolean; page: number; ids: List<string> };
};

type Pages = StaticallyTypedRecord<PagesObject>;

type EntitiesObject = { [key: string]: EntryMap };

type Entities = StaticallyTypedRecord<EntitiesObject>;

export type Entries = StaticallyTypedRecord<{
  pages: Pages & PagesObject;
  entities: Entities & EntitiesObject;
}>;

export type Deploys = StaticallyTypedRecord<{}>;

export type EditorialWorkflow = StaticallyTypedRecord<{}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EntryObject = {
  path: string;
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  collection: string;
};

export type EntryMap = StaticallyTypedRecord<EntryObject>;

export type FieldsErrors = StaticallyTypedRecord<{ [field: string]: { type: string }[] }>;

export type EntryDraft = StaticallyTypedRecord<{
  entry: EntryMap & EntryObject;
  mediaFiles: List<MediaFile>;
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

type CollectionObject = {
  name: string;
  folder: string;
  fields: EntryFields;
  isFetching: boolean;
  media_folder?: string;
};

export type Collection = StaticallyTypedRecord<CollectionObject>;

export type Collections = StaticallyTypedRecord<{ [path: string]: Collection & CollectionObject }>;

export type Medias = StaticallyTypedRecord<{ [path: string]: AssetProxy | undefined }>;

interface MediaLibraryInstance {
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

export interface MediaFile {
  name: string;
  id: string;
  size?: number;
  displayURL?: { sha: string; path: string } | string;
  path: string;
  draft?: boolean;
  url?: string;
}

interface DisplayURLsObject {
  [id: string]: Map<string, string>;
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
