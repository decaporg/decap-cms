import isBoolean from 'lodash/isBoolean';

import type { MediaFile } from '../backend';

interface Options {
  partial?: boolean;
  raw?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  label?: string | null;
  isModification?: boolean | null;
  mediaFiles?: MediaFile[] | null;
  author?: string;
  updatedOn?: string;
  status?: string;
  meta?: { path?: string };
  i18n?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [locale: string]: any;
  };
}

export interface EntryValue {
  collection: string;
  slug: string;
  path: string;
  partial: boolean;
  raw: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  label: string | null;
  isModification: boolean | null;
  mediaFiles: MediaFile[];
  author: string;
  updatedOn: string;
  status?: string;
  meta: { path?: string };
  i18n?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [locale: string]: any;
  };
  /**
   * Locales whose file was found when the entry was loaded. Set only for
   * `multiple_files` and `multiple_folders` i18n, where each locale is its own
   * file; see mergeValues in lib/i18n.
   */
  i18nLocales?: string[];
}

export function createEntry(collection: string, slug = '', path = '', options: Options = {}) {
  const returnObj: EntryValue = {
    collection,
    slug,
    path,
    partial: options.partial || false,
    raw: options.raw || '',
    data: options.data || {},
    label: options.label || null,
    isModification: isBoolean(options.isModification) ? options.isModification : null,
    mediaFiles: options.mediaFiles || [],
    author: options.author || '',
    updatedOn: options.updatedOn || '',
    status: options.status || '',
    meta: options.meta || {},
    i18n: options.i18n || {},
  };

  return returnObj;
}
