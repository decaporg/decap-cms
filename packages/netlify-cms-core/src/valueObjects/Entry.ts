import { isBoolean } from 'lodash';

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
  supportsApprove?: boolean;
  canApprove?: boolean;
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
  supportsApprove: boolean;
  canApprove: boolean;
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
    canApprove: options.canApprove || false,
    supportsApprove: options.supportsApprove || false,
  };

  return returnObj;
}
