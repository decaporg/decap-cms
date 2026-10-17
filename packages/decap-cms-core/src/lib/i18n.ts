import { Map, List } from 'immutable';
import set from 'lodash/set';
import groupBy from 'lodash/groupBy';
import escapeRegExp from 'lodash/escapeRegExp';

import { selectEntrySlug } from '../reducers/collections';

import type { Collection, Entry, EntryDraft, EntryField, EntryMap } from '../types/redux';
import type { EntryValue } from '../valueObjects/Entry';

export const I18N = 'i18n';

export enum I18N_STRUCTURE {
  MULTIPLE_FOLDERS = 'multiple_folders',
  MULTIPLE_FILES = 'multiple_files',
  SINGLE_FILE = 'single_file',
}

export const TRANSLATION_KEY = 'translationKey';

export const LOCALIZED_SLUG_VARIABLE = /{{ *([^}{| ]+) \| localize *}}/;

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

/**
 * Whether the slug template has tags with the `localize` filter, so each locale
 * gets its own file name. Files of one entry are then linked by TRANSLATION_KEY.
 */
export function hasLocalizedSlugs(collection: Collection) {
  if (!hasI18n(collection)) {
    return false;
  }
  const { structure } = getI18nInfo(collection) as I18nInfo;
  return (
    structure !== I18N_STRUCTURE.SINGLE_FILE &&
    LOCALIZED_SLUG_VARIABLE.test(collection.get('slug') || '')
  );
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

/**
 * Every file of an entry, marked by whether it is known to exist (the default
 * locale, and locales found on load); the rest must be checked before deleting.
 */
export function getI18nFilesToDelete(
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
  entry?: EntryMap,
) {
  const { structure, locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    return [{ path, known: true }];
  }

  const found = entry?.get('i18nLocales');
  const localizedPaths = entry?.get('i18nPaths');
  return locales.map(locale => {
    const localizedPath = localizedPaths?.get(locale);
    if (localizedPath) {
      return { path: localizedPath, known: true };
    }
    return {
      path: getFilePath(structure as I18N_STRUCTURE, extension, path, slug, locale),
      known: locale === defaultLocale || !!found?.includes(locale),
    };
  });
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
  localizedPaths: Record<string, string> = {},
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
      const localizedPath = localizedPaths[locale];
      return {
        path: localizedPath || getFilePath(structure, extension, path, slug, locale),
        slug,
        raw: draft.get('data') ? entryToRaw(draft) : '',
        ...(newPath &&
          !localizedPath && {
            newPath: getFilePath(structure, extension, newPath, slug, locale),
          }),
      };
    })
    .filter(dataFile => dataFile.raw);
  return dataFiles;
}

export function setI18nTranslationKey(
  collection: Collection,
  entry: EntryMap,
  translationKey: string,
) {
  const { locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  return locales.reduce((entry, locale) => {
    const dataPath = getDataPath(locale, defaultLocale);
    return entry.getIn(dataPath)
      ? entry.setIn([...dataPath, TRANSLATION_KEY], translationKey)
      : entry;
  }, entry);
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

function applyDefaultI18nValues(
  collection: Collection,
  value: EntryValue,
  defaultLocaleValue: EntryValue,
) {
  if (collection.get('fields') === undefined) {
    return;
  }
  collection.get('fields').forEach(field => {
    if (field && field.get(I18N) === I18N_FIELD.DUPLICATE) {
      const data = value.data[field.get('name')];
      if (!data) {
        value.data[field.get('name')] = defaultLocaleValue.data[field.get('name')];
      }
    }
  });
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
      if (defaultEntry) {
        applyDefaultI18nValues(collection, value, defaultEntry.value);
      }
      return set(acc, dataPath, value.data);
    }, {});

  const path = normalizeFilePath(structure, defaultEntry.value.path, defaultLocale);
  const slug = selectEntrySlug(collection, path) as string;
  // Which locales have a file: GitHub answers a missing file with empty content,
  // and deleteEntry must not ask to delete one, which fails the whole commit.
  const i18nLocales = values
    .filter(({ locale, value }) => locale === defaultEntry!.locale || value.raw !== '')
    .map(({ locale }) => locale);
  const entryValue: EntryValue = {
    ...defaultEntry.value,
    raw: '',
    ...i18n,
    path,
    slug,
    i18nLocales,
  };

  if (hasLocalizedSlugs(collection)) {
    // Only the files not named after the default locale's slug.
    entryValue.i18nPaths = Object.fromEntries(
      values
        .filter(
          ({ locale, value }) =>
            locale !== defaultEntry!.locale &&
            value.raw !== '' &&
            normalizeFilePath(structure, value.path, locale) !== path,
        )
        .map(({ locale, value }) => [locale, value.path]),
    );
  }

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
  getLocalizedPaths?: () => Promise<Record<string, string> | undefined>,
) {
  const { structure, locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  let entryValue: EntryValue;
  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    entryValue = mergeSingleFileValue(await getEntryValue(path), defaultLocale, locales);
  } else {
    const entryValuesResults = await Promise.allSettled(
      locales.map(async locale => {
        const entryPath = getFilePath(structure, extension, path, slug, locale);
        const value = await getEntryValue(entryPath);
        return { value, locale };
      }),
    );

    let nonNullValues = entryValuesResults
      .map(e => (e.status === 'fulfilled' ? e.value : undefined))
      .filter((e): e is { value: EntryValue; locale: string } => e !== undefined);

    const missingLocales = getLocalizedPaths
      ? locales.filter(
          locale =>
            locale !== defaultLocale &&
            !nonNullValues.some(e => e.locale === locale && e.value.raw !== ''),
        )
      : [];
    if (getLocalizedPaths && nonNullValues.length > 0 && missingLocales.length > 0) {
      const localizedPaths = (await getLocalizedPaths()) || {};
      const localizedResults = await Promise.allSettled(
        missingLocales
          .filter(locale => localizedPaths[locale])
          .map(async locale => {
            const value = await getEntryValue(localizedPaths[locale]);
            return { value, locale };
          }),
      );
      const localizedValues = localizedResults
        .map(e => (e.status === 'fulfilled' ? e.value : undefined))
        .filter((e): e is { value: EntryValue; locale: string } => e !== undefined);

      nonNullValues = [
        ...nonNullValues.filter(e => !localizedValues.some(({ locale }) => locale === e.locale)),
        ...localizedValues,
      ];
    }

    if (nonNullValues.length === 0) {
      // mergeValues will throw on an empty list, and show the error messages.
      const [error = new Error('No entry values found for any locale')] = entryValuesResults
        .map(e => (e.status === 'rejected' ? e.reason : undefined))
        .filter(e => e !== undefined);

      throw error;
    }

    entryValue = mergeValues(collection, structure, defaultLocale, nonNullValues);
  }

  return entryValue;
}

export function groupEntries(collection: Collection, extension: string, entries: EntryValue[]) {
  const { structure, defaultLocale, locales } = getI18nInfo(collection) as I18nInfo;
  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    return entries.map(e => mergeSingleFileValue(e, defaultLocale, locales));
  }

  const localizedSlugs = hasLocalizedSlugs(collection);
  const grouped = groupBy(
    entries.map(e => ({
      locale: getLocaleFromPath(structure, extension, e.path) as string,
      value: e,
    })),
    ({ locale, value: e }) => {
      const path = normalizeFilePath(structure, e.path, locale);
      if (!localizedSlugs) {
        return path;
      }
      return e.data?.[TRANSLATION_KEY] || selectEntrySlug(collection, path);
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

  if (hasLocalizedSlugs(collection)) {
    return [...dataFiles, ...diffFiles.filter(file => !paths.includes(file.path))];
  }

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
