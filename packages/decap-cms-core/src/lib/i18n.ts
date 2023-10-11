import { Map, List } from 'immutable';
import { set, groupBy, escapeRegExp } from 'lodash';

import { selectEntrySlug } from '../reducers/collections';

import type { Collection, Entry, EntryDraft, EntryField, EntryMap } from '../types/redux';
import type { EntryValue } from '../valueObjects/Entry';

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

export function hasI18n(collection: Collection) {
  return collection.has(I18N);
}

export type I18nInfo = {
  locales: string[];
  defaultLocale: string;
  structure: I18N_STRUCTURE;
};

export function getI18nInfo(collection: Collection) {
  if (!hasI18n(collection)) {
    return {};
  }
  const { structure, locales, default_locale: defaultLocale } = collection.get(I18N).toJS();
  return { structure, locales, defaultLocale } as I18nInfo;
}

export function getI18nFilesDepth(collection: Collection, depth: number) {
  const { structure } = getI18nInfo(collection) as I18nInfo;
  if (structure === I18N_STRUCTURE.MULTIPLE_FOLDERS) {
    return depth + 1;
  }
  return depth;
}

export function isFieldTranslatable(field: EntryField, locale: string, defaultLocale: string) {
  const isTranslatable = locale !== defaultLocale && field.get(I18N) === I18N_FIELD.TRANSLATE;
  return isTranslatable;
}

export function isFieldDuplicate(field: EntryField, locale: string, defaultLocale: string) {
  const isDuplicate = locale !== defaultLocale && field.get(I18N) === I18N_FIELD.DUPLICATE;
  return isDuplicate;
}

export function isFieldHidden(field: EntryField, locale: string, defaultLocale: string) {
  const isHidden = locale !== defaultLocale && field.get(I18N) === I18N_FIELD.NONE;
  return isHidden;
}

export function getLocaleDataPath(locale: string) {
  return [I18N, locale, 'data'];
}

export function getDataPath(locale: string, defaultLocale: string) {
  const dataPath = locale !== defaultLocale ? getLocaleDataPath(locale) : ['data'];
  return dataPath;
}

export function getFilePath(
  structure: I18N_STRUCTURE,
  extension: string,
  path: string,
  slug: string,
  locale: string,
) {
  switch (structure) {
    case I18N_STRUCTURE.MULTIPLE_FOLDERS:
      return path.replace(`/${slug}`, `/${locale}/${slug}`);
    case I18N_STRUCTURE.MULTIPLE_FILES:
      return path.replace(new RegExp(`${escapeRegExp(extension)}$`), `${locale}.${extension}`);
    case I18N_STRUCTURE.SINGLE_FILE:
    default:
      return path;
  }
}

export function getLocaleFromPath(structure: I18N_STRUCTURE, extension: string, path: string) {
  switch (structure) {
    case I18N_STRUCTURE.MULTIPLE_FOLDERS: {
      const parts = path.split('/');
      // filename
      parts.pop();
      // locale
      return parts.pop();
    }
    case I18N_STRUCTURE.MULTIPLE_FILES: {
      const parts = path.slice(0, -`.${extension}`.length);
      return parts.split('.').pop();
    }
    case I18N_STRUCTURE.SINGLE_FILE:
    default:
      return '';
  }
}

export function getFilePaths(
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
) {
  const { structure, locales } = getI18nInfo(collection) as I18nInfo;

  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    return [path];
  }

  const paths = locales.map(locale =>
    getFilePath(structure as I18N_STRUCTURE, extension, path, slug, locale),
  );

  return paths;
}

export function normalizeFilePath(structure: I18N_STRUCTURE, path: string, locale: string) {
  switch (structure) {
    case I18N_STRUCTURE.MULTIPLE_FOLDERS:
      return path.replace(`${locale}/`, '');
    case I18N_STRUCTURE.MULTIPLE_FILES:
      return path.replace(`.${locale}`, '');
    case I18N_STRUCTURE.SINGLE_FILE:
    default:
      return path;
  }
}

export function getI18nFiles(
  collection: Collection,
  extension: string,
  entryDraft: EntryMap,
  entryToRaw: (entryDraft: EntryMap) => string,
  path: string,
  slug: string,
  newPath?: string,
) {
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
          newPath: getFilePath(structure, extension, newPath, slug, locales[0]),
        }),
      },
    ];
  }

  const dataFiles = locales
    .map(locale => {
      const dataPath = getDataPath(locale, defaultLocale);
      const draft = entryDraft.set('data', entryDraft.getIn(dataPath));
      return {
        path: getFilePath(structure, extension, path, slug, locale),
        slug,
        raw: draft.get('data') ? entryToRaw(draft) : '',
        ...(newPath && {
          newPath: getFilePath(structure, extension, newPath, slug, locale),
        }),
      };
    })
    .filter(dataFile => dataFile.raw);
  return dataFiles;
}

export function getI18nBackup(
  collection: Collection,
  entry: EntryMap,
  entryToRaw: (entry: EntryMap) => string,
) {
  const { locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  const i18nBackup = locales
    .filter(l => l !== defaultLocale)
    .reduce((acc, locale) => {
      const dataPath = getDataPath(locale, defaultLocale);
      const data = entry.getIn(dataPath);
      if (!data) {
        return acc;
      }
      const draft = entry.set('data', data);
      return { ...acc, [locale]: { raw: entryToRaw(draft) } };
    }, {} as Record<string, { raw: string }>);

  return i18nBackup;
}

export function formatI18nBackup(
  i18nBackup: Record<string, { raw: string }>,
  formatRawData: (raw: string) => EntryValue,
) {
  const i18n = Object.entries(i18nBackup).reduce((acc, [locale, { raw }]) => {
    const entry = formatRawData(raw);
    return { ...acc, [locale]: { data: entry.data } };
  }, {});

  return i18n;
}

function mergeValues(
  collection: Collection,
  structure: I18N_STRUCTURE,
  defaultLocale: string,
  values: { locale: string; value: EntryValue }[],
) {
  let defaultEntry = values.find(e => e.locale === defaultLocale);
  if (!defaultEntry) {
    defaultEntry = values[0];
    console.warn(`Could not locale entry for default locale '${defaultLocale}'`);
  }
  const i18n = values
    .filter(e => e.locale !== defaultEntry!.locale)
    .reduce((acc, { locale, value }) => {
      const dataPath = getLocaleDataPath(locale);
      return set(acc, dataPath, value.data);
    }, {});

  const path = normalizeFilePath(structure, defaultEntry.value.path, defaultLocale);
  const slug = selectEntrySlug(collection, path) as string;
  const entryValue: EntryValue = {
    ...defaultEntry.value,
    raw: '',
    ...i18n,
    path,
    slug,
  };

  return entryValue;
}

function mergeSingleFileValue(
  entryValue: EntryValue,
  defaultLocale: string,
  locales: string[],
): EntryValue {
  const data = entryValue.data[defaultLocale] || {};
  const i18n = locales
    .filter(l => l !== defaultLocale)
    .map(l => ({ locale: l, value: entryValue.data[l] }))
    .filter(e => e.value)
    .reduce((acc, e) => {
      return { ...acc, [e.locale]: { data: e.value } };
    }, {});

  return {
    ...entryValue,
    data,
    i18n,
    raw: '',
  };
}

export async function getI18nEntry(
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
  getEntryValue: (path: string) => Promise<EntryValue>,
) {
  const { structure, locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  let entryValue: EntryValue;
  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    entryValue = mergeSingleFileValue(await getEntryValue(path), defaultLocale, locales);
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

    entryValue = mergeValues(collection, structure, defaultLocale, nonNullValues);
  }

  return entryValue;
}

export function groupEntries(collection: Collection, extension: string, entries: EntryValue[]) {
  const { structure, defaultLocale, locales } = getI18nInfo(collection) as I18nInfo;
  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    return entries.map(e => mergeSingleFileValue(e, defaultLocale, locales));
  }

  const grouped = groupBy(
    entries.map(e => ({
      locale: getLocaleFromPath(structure, extension, e.path) as string,
      value: e,
    })),
    ({ locale, value: e }) => {
      return normalizeFilePath(structure, e.path, locale);
    },
  );

  const groupedEntries = Object.values(grouped).reduce((acc, values) => {
    const entryValue = mergeValues(collection, structure, defaultLocale, values);
    return [...acc, entryValue];
  }, [] as EntryValue[]);

  return groupedEntries;
}

export function getI18nDataFiles(
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
  diffFiles: { path: string; id: string; newFile: boolean }[],
) {
  const { structure } = getI18nInfo(collection) as I18nInfo;
  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    return diffFiles;
  }
  const paths = getFilePaths(collection, extension, path, slug);
  const dataFiles = paths.reduce((acc, path) => {
    const dataFile = diffFiles.find(file => file.path === path);
    if (dataFile) {
      return [...acc, dataFile];
    } else {
      return [...acc, { path, id: '', newFile: false }];
    }
  }, [] as { path: string; id: string; newFile: boolean }[]);

  return dataFiles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function duplicateDefaultI18nFields(collection: Collection, dataFields: any) {
  const { locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  const i18nFields = Object.fromEntries(
    locales
      .filter(locale => locale !== defaultLocale)
      .map(locale => [locale, { data: dataFields }]),
  );

  return i18nFields;
}

export function duplicateI18nFields(
  entryDraft: EntryDraft,
  field: EntryField,
  locales: string[],
  defaultLocale: string,
  fieldPath: string[] = [field.get('name')],
) {
  const value = entryDraft.getIn(['entry', 'data', ...fieldPath]);
  if (field.get(I18N) === I18N_FIELD.DUPLICATE) {
    locales
      .filter(l => l !== defaultLocale)
      .forEach(l => {
        entryDraft = entryDraft.setIn(
          ['entry', ...getDataPath(l, defaultLocale), ...fieldPath],
          value,
        );
      });
  }

  if (field.has('field') && !List.isList(value)) {
    const fields = [field.get('field') as EntryField];
    fields.forEach(field => {
      entryDraft = duplicateI18nFields(entryDraft, field, locales, defaultLocale, [
        ...fieldPath,
        field.get('name'),
      ]);
    });
  } else if (field.has('fields') && !List.isList(value)) {
    const fields = field.get('fields')!.toArray() as EntryField[];
    fields.forEach(field => {
      entryDraft = duplicateI18nFields(entryDraft, field, locales, defaultLocale, [
        ...fieldPath,
        field.get('name'),
      ]);
    });
  }

  return entryDraft;
}

export function getPreviewEntry(entry: EntryMap, locale: string, defaultLocale: string) {
  if (locale === defaultLocale) {
    return entry;
  }
  return entry.set('data', entry.getIn([I18N, locale, 'data']));
}

export function serializeI18n(
  collection: Collection,
  entry: Entry,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serializeValues: (data: any) => any,
) {
  const { locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  locales
    .filter(locale => locale !== defaultLocale)
    .forEach(locale => {
      const dataPath = getLocaleDataPath(locale);
      entry = entry.setIn(dataPath, serializeValues(entry.getIn(dataPath)));
    });

  return entry;
}
