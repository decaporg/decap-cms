import { Action } from 'redux';

interface StaticallyTypedRecord<T> {
  get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K];
  set<K extends keyof T, V extends T[K]>(key: K, value: V): StaticallyTypedRecord<T>;
  delete<K extends keyof T>(key: K): StaticallyTypedRecord<T>;
  getIn<K1 extends keyof T, K2 extends keyof T[K1], V extends T[K1][K2]>(
    keys: [K1, K2],
    defaultValue?: V,
  ): T[K1][K2];
  getIn<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    V extends T[K1][K2][K3]
  >(
    keys: [K1, K2, K3],
    defaultValue?: V,
  ): T[K1][K2][K3];
  toJS(): T;
}

interface StaticallyTypedList<T> {
  toJS(): T[];
}

export type Config = StaticallyTypedRecord<{
  media_folder: string;
  public_folder: string;
}>;

export type Entries = StaticallyTypedRecord<{}>;

export type Deploys = StaticallyTypedRecord<{}>;

export type EditorialWorkflow = StaticallyTypedRecord<{}>;

export type Medias = StaticallyTypedRecord<{ [path: string]: MediaAsset | undefined }>;

export type MediaLibrary = StaticallyTypedRecord<{ externalLibrary?: string }>;

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
  deploys: Deploys;
  editorialWorkflow: EditorialWorkflow;
  entries: Entries;
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
