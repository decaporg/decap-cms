import { Collection } from '../types/redux';

export const I18N = 'i18n';

export enum I18N_STRUCTURE {
  MULTIPLE_FOLDERS = 'multiple_folders',
  MULTIPLE_FILES = 'multiple_files',
  SINGLE_FILE = 'single_file',
}

export enum I18N_FIELD {
  TRANSLATE = 'translate',
  DUPLICATE = 'duplicate',
}

export const hasI18n = (collection: Collection) => {
  return collection.has('i18n');
};

export const getI18nInfo = (collection: Collection) => {
  if (!hasI18n(collection)) {
    return {};
  }
  const { structure, locales, default_locale: defaultLocale } = collection.get('i18n').toJS();
  return { structure, locales, defaultLocale };
};

export const getLocaleFromSlug = (collection: Collection, slug: string) => {
  const { structure } = getI18nInfo(collection);
  return structure === I18N_STRUCTURE.MULTIPLE_FILES
    ? slug.split('.').pop()
    : slug.split('/').shift();
};

export const getI18nFilesDepth = (collection: Collection, depth: number) => {
  const { structure } = getI18nInfo(collection);
  if (structure === I18N_STRUCTURE.MULTIPLE_FOLDERS) {
    return depth + 1;
  }
  return depth;
};

export const hasI18nMultipleFiles = (collection: Collection) => {
  const { structure } = getI18nInfo(collection);
  return (
    structure === I18N_STRUCTURE.MULTIPLE_FILES || structure === I18N_STRUCTURE.MULTIPLE_FOLDERS
  );
};
