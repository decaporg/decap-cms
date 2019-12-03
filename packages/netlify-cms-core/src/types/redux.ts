import { Action } from 'redux';
import { StaticallyTypedRecord, StaticallyTypedList } from './immutable';
import { Map } from 'immutable';

export type Config = StaticallyTypedRecord<{
  media_folder: string;
  public_folder: string;
  publish_mode?: string;
  media_library: StaticallyTypedRecord<{ name: string }> & { name: string };
  locale?: string;
  slug?: Map<string, string | boolean>;
  media_folder_relative?: boolean;
}>;

export type Entries = StaticallyTypedRecord<{}>;

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

export type EntryDraft = StaticallyTypedRecord<{
  entry: EntryMap & EntryObject;
  mediaFiles: StaticallyTypedList<{}>;
  fieldsErrors: StaticallyTypedRecord<{ [field: string]: { type: string }[] }>;
}>;

type CollectionObject = { name: string; folder: string };

export type Collection = StaticallyTypedRecord<CollectionObject>;

export type Collections = StaticallyTypedRecord<{ [path: string]: Collection & CollectionObject }>;

export type Medias = StaticallyTypedRecord<{ [path: string]: MediaAsset | undefined }>;

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
  path?: string;
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

export interface State {
  config: Config;
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

export interface MediaAsset {
  public_path: string;
}

export interface MediasAction extends Action<string> {
  payload: string | MediaAsset | MediaAsset[];
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
    integrations: StaticallyTypedList<Integration>;
    collections: StaticallyTypedRecord<{ name: string }>[];
  }>;
}
