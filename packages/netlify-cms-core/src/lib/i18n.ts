import { Map } from 'immutable';
import { set } from 'lodash';
import { Collection, EntryField, EntryMap } from '../types/redux';
import { EntryValue } from '../valueObjects/Entry';

export const I18N = 'i18n';

export enum I18N_STRUCTURE {
  MULTIPLE_FOLDERS = 'multiple_folders',
  MULTIPLE_FILES = 'multiple_files',
  SINGLE_FILE = 'single_file',
}

export enum I18N_FIELD {
  TRANSLATE = 'translate',
  DUPLICATE = 'duplicate',
  NONE = 'none',
}

export const hasI18n = (collection: Collection) => {
  return collection.has(I18N);
};

type I18nInfo = {
  locales: string[];
  defaultLocale: string;
  structure: I18N_STRUCTURE;
};

export const getI18nInfo = (collection: Collection) => {
  if (!hasI18n(collection)) {
    return {};
  }
  const { structure, locales, default_locale: defaultLocale } = collection.get(I18N).toJS();
  return { structure, locales, defaultLocale } as I18nInfo;
};

export const getI18nFilesDepth = (collection: Collection, depth: number) => {
  const { structure } = getI18nInfo(collection) as I18nInfo;
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
  const isHidden = locale !== defaultLocale && field.get(I18N) === I18N_FIELD.NONE;
  return isHidden;
};

export const getLocaleDataPath = (locale: string) => {
  return [I18N, locale, 'data'];
};

export const getDataPath = (locale: string, defaultLocale: string) => {
  const dataPath = locale !== defaultLocale ? getLocaleDataPath(locale) : ['data'];
  return dataPath;
};

export const getFilePath = (
  structure: I18N_STRUCTURE,
  extension: string,
  path: string,
  slug: string,
  locale: string,
) => {
  switch (structure) {
    case I18N_STRUCTURE.MULTIPLE_FOLDERS:
      return path.replace(`/${slug}`, `/${locale}/${slug}`);
    case I18N_STRUCTURE.MULTIPLE_FILES:
      return path.replace(extension, `${locale}.${extension}`);
    case I18N_STRUCTURE.SINGLE_FILE:
    default:
      return path;
  }
};

export const getFilePaths = (
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
) => {
  const { structure, locales } = getI18nInfo(collection) as I18nInfo;
  const paths = locales.map(locale =>
    getFilePath(structure as I18N_STRUCTURE, extension, path, slug, locale),
  );

  return paths;
};

export const normalizeFilePath = (structure: I18N_STRUCTURE, path: string, locale: string) => {
  switch (structure) {
    case I18N_STRUCTURE.MULTIPLE_FOLDERS:
      return path.replace(`${locale}/`, '');
    case I18N_STRUCTURE.MULTIPLE_FILES:
      return path.replace(`.${locale}`, '');
    case I18N_STRUCTURE.SINGLE_FILE:
    default:
      return path;
  }
};

export const getI18nFiles = (
  collection: Collection,
  extension: string,
  entryDraft: EntryMap,
  entryToRaw: (entryDraft: EntryMap) => string,
  path: string,
  slug: string,
  newPath?: string,
) => {
  const { structure, defaultLocale, locales } = getI18nInfo(collection) as I18nInfo;

  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    const data = locales.reduce((map, locale) => {
      const dataPath = getDataPath(locale, defaultLocale);
      return map.set(locale, entryDraft.getIn(dataPath));
    }, Map<string, unknown>({}));
    const draft = entryDraft.set('data', data);

    return [
      {
        path: getFilePath(structure, extension, path, slug, locales[0]),
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
    const draft = entryDraft.set('data', entryDraft.getIn(dataPath));
    return {
      path: getFilePath(structure, extension, path, slug, locale),
      slug,
      raw: entryToRaw(draft),
      ...(newPath && {
        newPath,
      }),
    };
  });
  return dataFiles;
};

export const getI18nEntry = async (
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
  getEntryValue: (path: string) => Promise<EntryValue>,
) => {
  const { structure, locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  let entryValue: EntryValue;
  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    entryValue = await getEntryValue(path);
  } else {
    const entryValues = await Promise.all(
      locales.map(async locale => {
        const entryPath = getFilePath(structure, extension, path, slug, locale);
        const value = await getEntryValue(entryPath).catch(() => null);
        return { value, locale };
      }),
    );

    const nonNullValues = entryValues.filter(e => e.value !== null) as {
      value: EntryValue;
      locale: string;
    }[];

    const defaultEntry = nonNullValues.find(e => e.locale === defaultLocale)!.value;
    const i18n = nonNullValues
      .filter(e => e.locale !== defaultLocale)
      .reduce((acc, { locale, value }) => {
        const dataPath = getLocaleDataPath(locale);
        return set(acc, dataPath, value.data);
      }, {});

    entryValue = {
      ...defaultEntry,
      raw: '',
      ...i18n,
      path: normalizeFilePath(structure as I18N_STRUCTURE, defaultEntry.path, defaultLocale),
    };
  }

  return entryValue;
};
