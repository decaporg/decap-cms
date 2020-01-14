import { isBoolean } from 'lodash';
import { ImplementationMediaFile } from 'netlify-cms-lib-util';

interface Options {
  partial?: boolean;
  raw?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  label?: string | null;
  metaData?: unknown | null;
  isModification?: boolean | null;
  mediaFiles?: ImplementationMediaFile[] | null;
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
  metaData: unknown | null;
  isModification: boolean | null;
  mediaFiles: ImplementationMediaFile[];
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
    metaData: options.metaData || null,
    isModification: isBoolean(options.isModification) ? options.isModification : null,
    mediaFiles: options.mediaFiles || [],
  };

  return returnObj;
}
