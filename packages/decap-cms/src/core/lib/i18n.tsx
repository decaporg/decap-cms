import { escapeRegExp, get, groupBy, set } from 'lodash-es';

import { selectEntrySlug } from '@/core/reducers/collections';

import type { CompleteEntryValue } from '@/core/valueObjects/Entry';
import type { CmsCollectionState, CmsEntry, CmsEntryField } from '@/lib/util/index';

type Collection = CmsCollectionState;
type EntryMap = CmsEntry;
type EntryField = CmsEntryField;

type EntryDraft = {
  entry: EntryMap,
  fieldsMetaData?: Record<string, unknown>,
  fieldsErrors?: Record<string, unknown>,
  hasChanged: boolean,
  key: string,
};

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
  return collection.i18n !== undefined && collection.i18n !== null;
}

export type I18nInfo = {
  locales: string[],
  defaultLocale: string,
  structure: I18N_STRUCTURE,
};

export function getI18nInfo(collection: Collection) {
  if (!hasI18n(collection)) {
    return {};
  }
  const i18n = collection.i18n;
  const { structure, locales, default_locale: defaultLocale } = i18n;
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
  const isTranslatable = locale !== defaultLocale && field.i18n === I18N_FIELD.TRANSLATE;
  return isTranslatable;
}

export function isFieldDuplicate(field: EntryField, locale: string, defaultLocale: string) {
  const isDuplicate = locale !== defaultLocale && field.i18n === I18N_FIELD.DUPLICATE;
  return isDuplicate;
}

export function isFieldHidden(field: EntryField, locale: string, defaultLocale: string) {
  const isHidden = locale !== defaultLocale && field.i18n === I18N_FIELD.NONE;
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

  const paths = locales.map(locale => getFilePath(structure as I18N_STRUCTURE, extension, path, slug, locale));

  return paths;
}

/**
 * The file paths an existing entry occupies: the default locale's plus every
 * locale it has data for. A locale nobody filled in has no file, and deleting
 * a missing file fails the whole commit on some hosts (GitLab rejects it), so
 * deleting or unpublishing must not name it. Without a loaded entry to go by,
 * every locale's path is returned.
 */
export function getEntryFilePaths(
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
  entry: Pick<CmsEntry, 'i18n'> | undefined,
) {
  const { structure, locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;
  if (!entry || structure === I18N_STRUCTURE.SINGLE_FILE) {
    return getFilePaths(collection, extension, path, slug);
  }
  const present = new Set([defaultLocale, ...Object.keys(entry.i18n ?? {})]);
  return locales
    .filter(locale => present.has(locale))
    .map(locale => getFilePath(structure, extension, path, slug, locale));
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
    const data = locales.reduce(
      (map, locale) => {
        const dataPath = getDataPath(locale, defaultLocale);
        return { ...map, [locale]: get(entryDraft, dataPath) };
      },
      {} as Record<string, unknown>,
    );
    const draft = { ...entryDraft, data };

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
      const draft = { ...entryDraft, data: get(entryDraft, dataPath) };
      return {
        path: getFilePath(structure, extension, path, slug, locale),
        slug,
        raw: draft.data ? entryToRaw(draft) : '',
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
    .reduce(
      (acc, locale) => {
        const dataPath = getDataPath(locale, defaultLocale);
        const data = get(entry, dataPath);
        if (!data) {
          return acc;
        }
        const draft = { ...entry, data };
        return { ...acc, [locale]: { raw: entryToRaw(draft) } };
      },
      {} as Record<string, { raw: string }>,
    );

  return i18nBackup;
}

export function formatI18nBackup(
  i18nBackup: Record<string, { raw: string }>,
  formatRawData: (raw: string) => CompleteEntryValue,
) {
  const i18n = Object.entries(i18nBackup).reduce((acc, [locale, { raw }]) => {
    const entry = formatRawData(raw);
    return { ...acc, [locale]: { data: entry.data } };
  }, {});

  return i18n;
}

function applyDefaultI18nValues(
  collection: Collection,
  value: CompleteEntryValue,
  defaultLocaleValue: CompleteEntryValue,
) {
  if (collection.fields === undefined) {
    return;
  }
  collection.fields.forEach(field => {
    if (field && field.i18n === I18N_FIELD.DUPLICATE) {
      const data = value.data[field.name];
      if (!data) {
        value.data[field.name] = defaultLocaleValue.data[field.name];
      }
    }
  });
}

function mergeValues(
  collection: Collection,
  structure: I18N_STRUCTURE,
  defaultLocale: string,
  values: { locale: string, value: CompleteEntryValue }[],
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
  const entryValue: CompleteEntryValue = {
    ...defaultEntry.value,
    raw: '',
    ...i18n,
    path,
    slug,
  };

  return entryValue;
}

function mergeSingleFileValue(
  entryValue: CompleteEntryValue,
  defaultLocale: string,
  locales: string[],
): CompleteEntryValue {
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
  getEntryValue: (path: string) => Promise<CompleteEntryValue>,
) {
  const { structure, locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  let entryValue: CompleteEntryValue;
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

    const nonNullValues = entryValuesResults
      .map(e => (e.status === 'fulfilled' ? e.value : undefined))
      .filter((e): e is { value: CompleteEntryValue, locale: string } => e !== undefined);

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

export function groupEntries(
  collection: Collection,
  extension: string,
  entries: CompleteEntryValue[],
) {
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
  }, [] as CompleteEntryValue[]);

  return groupedEntries;
}

export function getI18nDataFiles(
  collection: Collection,
  extension: string,
  path: string,
  slug: string,
  diffFiles: { path: string, id: string, newFile: boolean }[],
) {
  const { structure } = getI18nInfo(collection) as I18nInfo;
  if (structure === I18N_STRUCTURE.SINGLE_FILE) {
    return diffFiles;
  }
  const paths = getFilePaths(collection, extension, path, slug);
  const dataFiles = paths.reduce(
    (acc, path) => {
      const dataFile = diffFiles.find(file => file.path === path);
      if (dataFile) {
        return [...acc, dataFile];
      } else {
        return [...acc, { path, id: '', newFile: false }];
      }
    },
    [] as { path: string, id: string, newFile: boolean }[],
  );

  return dataFiles;
}

export function duplicateDefaultI18nFields(
  collection: Collection,
  dataFields: Record<string, unknown>,
) {
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
  fieldPath: string[] = [field.name],
) {
  const value = get(entryDraft, ['entry', 'data', ...fieldPath]);
  if (field.i18n === I18N_FIELD.DUPLICATE) {
    locales
      .filter(l => l !== defaultLocale)
      .forEach(l => {
        set(entryDraft, ['entry', ...getDataPath(l, defaultLocale), ...fieldPath], value);
      });
  }

  if (field.field && !Array.isArray(value)) {
    const fields = [field.field as EntryField];
    fields.forEach(field => {
      entryDraft = duplicateI18nFields(entryDraft, field, locales, defaultLocale, [
        ...fieldPath,
        field.name,
      ]);
    });
  } else if (field.fields && !Array.isArray(value)) {
    const fields = field.fields as EntryField[];
    fields.forEach(field => {
      entryDraft = duplicateI18nFields(entryDraft, field, locales, defaultLocale, [
        ...fieldPath,
        field.name,
      ]);
    });
  }

  return entryDraft;
}

export function getPreviewEntry(entry: EntryMap, locale: string, defaultLocale: string) {
  if (locale === defaultLocale) {
    return entry;
  }
  return { ...entry, data: get(entry, [I18N, locale, 'data']) };
}

export function serializeI18n(
  collection: Collection,
  entry: EntryMap,
  serializeValues: (data: Record<string, unknown>) => Record<string, unknown>,
) {
  const { locales, defaultLocale } = getI18nInfo(collection) as I18nInfo;

  const otherLocales = locales.filter(locale => locale !== defaultLocale);
  if (otherLocales.length === 0) return entry;

  // Rebuild the i18n branch immutably instead of `set(entry, ...)`: the entry's
  // nested `i18n[locale]` objects come straight from redux state, which this
  // fork deep-freezes in development. lodash `set` mutates the existing frozen
  // object in place → "Cannot assign to read only property 'data'", which threw
  // before the network call and made Save/Publish a silent dead button on every
  // i18n collection (DCMS-471 follow-up).
  const i18nBranch = { ...(get(entry, [I18N]) as Record<string, any> | undefined) };
  for (const locale of otherLocales) {
    const localeEntry = i18nBranch[locale];
    i18nBranch[locale] = {
      ...(localeEntry ?? {}),
      data: serializeValues(get(entry, getLocaleDataPath(locale))),
    };
  }

  return { ...entry, [I18N]: i18nBranch };
}
