import { Map } from 'immutable';
import { Collection, EntryField, EntryDraft, EntryMap } from '../types/redux';

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
  return collection.has(I18N);
};

export const getI18nInfo = (collection: Collection) => {
  if (!hasI18n(collection)) {
    return { locales: [] as string[], defaultLocale: '' };
  }
  const { structure, locales, default_locale: defaultLocale } = collection.get(I18N).toJS();
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

export const isFieldTranslatable = (field: EntryField, locale: string, defaultLocale: string) => {
  const isTranslatable = locale !== defaultLocale && field.get(I18N) === I18N_FIELD.TRANSLATE;
  return isTranslatable;
};

export const isFieldDuplicate = (field: EntryField, locale: string, defaultLocale: string) => {
  const isDuplicate = locale !== defaultLocale && field.get(I18N) === I18N_FIELD.DUPLICATE;
  return isDuplicate;
};

export const isFieldHidden = (field: EntryField, locale: string, defaultLocale: string) => {
  const isHidden = locale !== defaultLocale && !field.get(I18N);
  return isHidden;
};

export const getLocaleDataPath = (locale: string) => {
  return [I18N, locale, 'data'];
};

export const getDataPath = (locale: string, defaultLocale: string) => {
  const dataPath = locale !== defaultLocale ? getLocaleDataPath(locale) : ['data'];
  return dataPath;
};

export const getI18nFiles = (
  collection: Collection,
  extension: string,
  entryDraft: EntryDraft,
  entryToRaw: (entryDraft: EntryMap) => string,
  path: string,
  slug: string,
  newPath?: string,
) => {
  const { structure, defaultLocale, locales } = getI18nInfo(collection);

  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    const data = locales.reduce((map, locale) => {
      const dataPath = getDataPath(locale, defaultLocale);
      return map.set(locale, entryDraft.getIn(dataPath));
    }, Map<string, unknown>({}));
    const draft = entryDraft.get('entry').set('data', data);

    return [
      {
        path,
        slug,
        raw: entryToRaw(draft),
        ...(newPath && {
          newPath,
        }),
      },
    ];
  }

  const dataFiles = locales.map(locale => {
    const dataPath = getDataPath(locale, defaultLocale);
    const draft = entryDraft.get('entry').set('data', entryDraft.getIn(dataPath));
    return {
      path:
        structure === I18N_STRUCTURE.MULTIPLE_FOLDERS
          ? path.replace(`/${slug}`, `/${locale}/${slug}`)
          : path.replace(extension, `${locale}.${extension}`),
      slug,
      raw: entryToRaw(draft),
      ...(newPath && {
        newPath,
      }),
    };
  });
  return dataFiles;
};
