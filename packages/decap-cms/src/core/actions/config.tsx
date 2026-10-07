import { produce } from 'immer';
import { cloneDeep, isEmpty, trim, trimStart } from 'lodash-es';

import { resolveBackend } from '@/core/backend';
import { FILES, FOLDER } from '@/core/constants/collectionTypes';
import { SIMPLE as SIMPLE_PUBLISH_MODE } from '@/core/constants/publishModes';
import { I18N, I18N_FIELD, I18N_STRUCTURE } from '@/core/lib/i18n';
import { getEntryCodec } from '@/core/lib/registry';
import { validateConfig } from '@/core/lib/validateConfig';
import { selectDefaultSortableFields } from '@/core/reducers/collections';
import { getIntegrations, selectIntegration } from '@/core/reducers/integrations';
import { deepMerge } from '@/lib/util/index';

import type {
  CmsCollection,
  CmsConfig,
  CmsField,
  CmsFieldBase,
  CmsFieldList,
  CmsFieldObject,
  CmsI18nConfig,
  CmsLocalBackend,
  CmsPublishMode,
} from '@/lib/util/index';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

type State = any;

export const CONFIG_REQUEST = 'CONFIG_REQUEST';
export const CONFIG_SUCCESS = 'CONFIG_SUCCESS';
export const CONFIG_FAILURE = 'CONFIG_FAILURE';

function isObjectField(field: CmsField): field is CmsFieldBase & CmsFieldObject {
  return 'fields' in (field as CmsFieldObject);
}

function isFieldList(field: CmsField): field is CmsFieldBase & CmsFieldList {
  return 'types' in (field as CmsFieldList) || 'field' in (field as CmsFieldList);
}

function traverseFieldsJS<Field extends CmsField>(
  fields: Field[],
  updater: <T extends CmsField>(field: T) => T,
): Field[] {
  return fields.map(field => {
    const newField = updater(field);
    if (isObjectField(newField)) {
      return { ...newField, fields: traverseFieldsJS(newField.fields, updater) };
    } else if (isFieldList(newField) && newField.field) {
      return { ...newField, field: traverseFieldsJS([newField.field], updater)[0] };
    } else if (isFieldList(newField) && newField.types) {
      return { ...newField, types: traverseFieldsJS(newField.types, updater) };
    }

    return newField;
  });
}

/**
 * Shorthand for referencing a top-level `field_groups` entry in place of a
 * regular field: `{ group: 'seo' }`. Only valid pre-expansion, i.e. before
 * `expandFieldGroups` runs as part of `normalizeConfig` - nothing past that
 * point should ever see one of these.
 */
export interface CmsFieldGroupRef {
  group: string;
}

type CmsFieldOrGroupRef = CmsField | CmsFieldGroupRef;

function isFieldGroupRef(field: CmsFieldOrGroupRef): field is CmsFieldGroupRef {
  return typeof (field as CmsFieldGroupRef).group === 'string' && !('name' in field);
}

/**
 * Expands `{ group: '<name>' }` field references into the corresponding
 * `field_groups[name]` field list, recursing into nested `object`/`list`
 * fields so groups can be used anywhere a field list appears, not only at
 * the top of a collection/file. Group fields are deep-cloned on every
 * expansion so multiple collections (or repeated uses within one
 * collection) never share the same field objects.
 */
export function expandFieldGroups(
  fields: CmsFieldOrGroupRef[],
  fieldGroups: Record<string, CmsField[]>,
  stack: string[] = [],
): CmsField[] {
  const expanded: CmsField[] = [];

  for (const field of fields) {
    if (isFieldGroupRef(field)) {
      const groupName = field.group;
      const group = fieldGroups[groupName];

      if (!group) {
        const available = Object.keys(fieldGroups);
        throw new Error(
          `Field group '${groupName}' is referenced but not defined in 'field_groups'.`
            + (available.length > 0
              ? ` Available groups: ${available.join(', ')}.`
              : ` No 'field_groups' are configured.`),
        );
      }

      if (stack.includes(groupName)) {
        throw new Error(
          `Circular 'field_groups' reference detected: ${[...stack, groupName].join(' -> ')}`,
        );
      }

      const clonedGroupFields = cloneDeep(group) as CmsFieldOrGroupRef[];
      expanded.push(...expandFieldGroups(clonedGroupFields, fieldGroups, [...stack, groupName]));
      continue;
    }

    if (isObjectField(field)) {
      expanded.push({
        ...field,
        fields: expandFieldGroups(field.fields as CmsFieldOrGroupRef[], fieldGroups, stack),
      });
    } else if (isFieldList(field)) {
      let newField = field;

      if (newField.field) {
        newField = {
          ...newField,
          field: expandFieldGroups([newField.field] as CmsFieldOrGroupRef[], fieldGroups, stack)[0],
        };
      }

      if (newField.fields) {
        newField = {
          ...newField,
          fields: expandFieldGroups(newField.fields as CmsFieldOrGroupRef[], fieldGroups, stack),
        };
      }

      if (newField.types) {
        newField = {
          ...newField,
          types: expandFieldGroups(
            newField.types as CmsFieldOrGroupRef[],
            fieldGroups,
            stack,
          ) as typeof newField.types,
        };
      }

      expanded.push(newField);
    } else {
      expanded.push(field);
    }
  }

  return expanded;
}

type ConfigFormat = 'yaml' | 'json' | 'toml';

const CONFIG_CONTENT_TYPES: Record<string, ConfigFormat> = {
  'text/yaml': 'yaml',
  'application/x-yaml': 'yaml',
  'application/yaml': 'yaml',
  'application/json': 'json',
  'text/json': 'json',
  'application/toml': 'toml',
  'text/toml': 'toml',
  'application/x-toml': 'toml',
};

function getConfigFormatFromContentType(contentType: string): ConfigFormat | undefined {
  return CONFIG_CONTENT_TYPES[contentType.split(';', 1)[0].trim().toLowerCase()];
}

function getConfigFormatFromUrl(url: string): ConfigFormat | undefined {
  const pathname = url.split(/[?#]/, 1)[0].toLowerCase();
  const extension = pathname.match(/\.([^.\\/]+)$/)?.[1];
  if (extension === 'yml' || extension === 'yaml') {
    return 'yaml';
  }
  if (extension === 'json' || extension === 'toml') {
    return extension;
  }
  return undefined;
}

/**
 * Resolved once here and reused by the in-CMS config editor (DCMS-1418) so it
 * reads/writes the same file `loadConfig` booted from, instead of hardcoding
 * `config.yml` and silently ignoring a `<link rel="cms-config-url">`
 * override.
 */
export function getConfigSource() {
  const configLinkEl = document.querySelector<HTMLLinkElement>('link[rel="cms-config-url"]');
  if (configLinkEl?.href) {
    const format = getConfigFormatFromUrl(configLinkEl.href)
      ?? getConfigFormatFromContentType(configLinkEl.type);
    console.log(`Using config file path: "${configLinkEl.href}"`);
    return { url: configLinkEl.href, format };
  }
  return { url: 'config.yml' as const, format: 'yaml' as const };
}

function setDefaultPublicFolderForField<T extends CmsField>(field: T) {
  if ('media_folder' in field && !('public_folder' in field)) {
    return { ...field, public_folder: field.media_folder };
  }
  return field;
}

// Mapping between existing camelCase and its snake_case counterpart
const WIDGET_KEY_MAP = {
  dateFormat: 'date_format',
  timeFormat: 'time_format',
  pickerUtc: 'picker_utc',
  valueType: 'value_type',
  valueField: 'value_field',
  searchFields: 'search_fields',
  displayFields: 'display_fields',
  optionsLength: 'options_length',
} as const;

function setSnakeCaseConfig<T extends CmsField>(field: T) {
  const deprecatedKeys = Object.keys(WIDGET_KEY_MAP).filter(
    camel => camel in field,
  ) as ReadonlyArray<keyof typeof WIDGET_KEY_MAP>;

  const snakeValues = deprecatedKeys.map(camel => {
    const snake = WIDGET_KEY_MAP[camel];
    console.warn(
      `Field ${field.name} is using a deprecated configuration '${camel}'. Please use '${snake}'`,
    );
    return { [snake]: (field as unknown as Record<string, unknown>)[camel] };
  });

  return Object.assign({}, field, ...snakeValues) as T;
}

function setI18nField<T extends CmsField>(field: T) {
  if (field[I18N] === true) {
    return { ...field, [I18N]: I18N_FIELD.TRANSLATE };
  } else if (field[I18N] === false || !field[I18N]) {
    return { ...field, [I18N]: I18N_FIELD.NONE };
  }
  return field;
}

function getI18nDefaults(
  collectionOrFileI18n: boolean | CmsI18nConfig,
  defaultI18n: CmsI18nConfig,
) {
  if (typeof collectionOrFileI18n === 'boolean') {
    return defaultI18n;
  } else {
    const locales = collectionOrFileI18n.locales || defaultI18n.locales;
    const defaultLocale = collectionOrFileI18n.default_locale || locales[0];
    const mergedI18n: CmsI18nConfig = deepMerge(defaultI18n, collectionOrFileI18n);
    mergedI18n.locales = locales;
    mergedI18n.default_locale = defaultLocale;
    throwOnMissingDefaultLocale(mergedI18n);
    return mergedI18n;
  }
}

function setI18nDefaultsForFields(collectionOrFileFields: CmsField[], hasI18n: boolean) {
  if (hasI18n) {
    return traverseFieldsJS(collectionOrFileFields, setI18nField);
  } else {
    return traverseFieldsJS(collectionOrFileFields, field => {
      const newField = { ...field };
      delete newField[I18N];
      return newField;
    });
  }
}

function throwOnInvalidFileCollectionStructure(i18n?: CmsI18nConfig) {
  if (i18n && i18n.structure !== I18N_STRUCTURE.SINGLE_FILE) {
    throw new Error(
      `i18n configuration for files collections is limited to ${I18N_STRUCTURE.SINGLE_FILE} structure`,
    );
  }
}

function throwOnMissingDefaultLocale(i18n?: CmsI18nConfig) {
  if (i18n && i18n.default_locale && !i18n.locales.includes(i18n.default_locale)) {
    throw new Error(
      `i18n locales '${i18n.locales.join(', ')}' are missing the default locale ${i18n.default_locale}`,
    );
  }
}

// The schema validator can't express per-property validation for objects
// with unknown key names (see the `roles` entry in `validateConfig.ts`), so
// the role -> scope-list shape is checked here instead.
function throwOnInvalidRoles(roles?: CmsConfig['roles']) {
  if (!roles) {
    return;
  }
  for (const [name, scopes] of Object.entries(roles)) {
    if (!Array.isArray(scopes) || scopes.some(scope => typeof scope !== 'string')) {
      throw new Error(`Role '${name}' in 'roles' must be a list of scope strings`);
    }
  }
}

function hasIntegration(config: CmsConfig, collection: CmsCollection) {
  const integrations = getIntegrations(config);
  const integration = selectIntegration(integrations, collection.name, 'listEntries');
  return !!integration;
}

function normalizeSortableFields(
  sortableFields: (
    | string
    | { field: string, label?: string, default_sort?: boolean | 'asc' | 'desc' }
  )[],
) {
  return sortableFields.map(field => {
    if (typeof field === 'string') {
      return { field };
    }
    return field;
  });
}

export function normalizeConfig(config: CmsConfig) {
  const { collections = [], field_groups: fieldGroups = {} } = config;

  throwOnInvalidRoles(config.roles);

  const normalizedCollections = collections.map(collection => {
    const { fields, files } = collection;

    let normalizedCollection = collection;
    if (fields) {
      const expandedFields = expandFieldGroups(fields as CmsFieldOrGroupRef[], fieldGroups);
      const normalizedFields = traverseFieldsJS(expandedFields, setSnakeCaseConfig);
      normalizedCollection = { ...normalizedCollection, fields: normalizedFields };
    }

    if (files) {
      const normalizedFiles = files.map(file => {
        const expandedFileFields = expandFieldGroups(file.fields as CmsFieldOrGroupRef[], fieldGroups);
        const normalizedFileFields = traverseFieldsJS(expandedFileFields, setSnakeCaseConfig);
        return { ...file, fields: normalizedFileFields };
      });
      normalizedCollection = { ...normalizedCollection, files: normalizedFiles };
    }

    if (normalizedCollection.sortableFields) {
      const { sortableFields, ...rest } = normalizedCollection;
      normalizedCollection = { ...rest, sortable_fields: sortableFields };

      console.warn(
        `Collection ${collection.name} is using a deprecated configuration 'sortableFields'. Please use 'sortable_fields'`,
      );
    }

    // Normalize sortable_fields to consistent object format
    if (normalizedCollection.sortable_fields) {
      normalizedCollection = {
        ...normalizedCollection,
        sortable_fields: normalizeSortableFields(normalizedCollection.sortable_fields),
      };
    }

    return normalizedCollection;
  });

  return { ...config, collections: normalizedCollections };
}

export function applyDefaults(originalConfig: CmsConfig) {
  return produce(originalConfig, config => {
    config.publish_mode = config.publish_mode || SIMPLE_PUBLISH_MODE;
    config.slug = config.slug || {};
    config.collections = config.collections || [];

    // Use `site_url` as default `display_url`.
    if (!config.display_url && config.site_url) {
      config.display_url = config.site_url;
    }

    // Use media_folder as default public_folder.
    const defaultPublicFolder = `/${trimStart(config.media_folder, '/')}`;
    if (!('public_folder' in config)) {
      config.public_folder = defaultPublicFolder;
    }

    // default values for the slug config
    if (!('encoding' in config.slug)) {
      config.slug.encoding = 'unicode';
    }

    if (!('clean_accents' in config.slug)) {
      config.slug.clean_accents = false;
    }

    if (!('sanitize_replacement' in config.slug)) {
      config.slug.sanitize_replacement = '-';
    }

    const i18n = config[I18N];

    if (i18n) {
      i18n.default_locale = i18n.default_locale || i18n.locales[0];
    }

    throwOnMissingDefaultLocale(i18n);

    const backend = resolveBackend(config);

    for (const collection of config.collections) {
      if (!('publish' in collection)) {
        collection.publish = true;
      }

      let collectionI18n = collection[I18N];

      if (i18n && collectionI18n) {
        collectionI18n = getI18nDefaults(collectionI18n, i18n);
        collection[I18N] = collectionI18n;
      } else {
        collectionI18n = undefined;
        delete collection[I18N];
      }

      if (collection.fields) {
        collection.fields = setI18nDefaultsForFields(collection.fields, Boolean(collectionI18n));
      }

      const { folder, files, view_filters, view_groups, meta } = collection;

      if (folder) {
        collection.type = FOLDER;

        if (collection.path && !collection.media_folder) {
          // default value for media folder when using the path config
          collection.media_folder = '';
        }

        if ('media_folder' in collection && !('public_folder' in collection)) {
          collection.public_folder = collection.media_folder;
        }

        if (collection.fields) {
          collection.fields = traverseFieldsJS(collection.fields, setDefaultPublicFolderForField);
        }

        collection.folder = trim(folder, '/');

        if (meta && meta.path) {
          const metaPath = meta.path;
          const metaField = {
            name: 'path',
            meta: true,
            required: true,
            ...metaPath,
          };
          collection.fields = [metaField, ...(collection.fields || [])];
        }
      }

      if (files) {
        collection.type = FILES;

        throwOnInvalidFileCollectionStructure(collectionI18n);

        delete collection.nested;
        delete collection.meta;

        for (const file of files) {
          file.file = trimStart(file.file, '/');

          if ('media_folder' in file && !('public_folder' in file)) {
            file.public_folder = file.media_folder;
          }

          if (file.fields) {
            file.fields = traverseFieldsJS(file.fields, setDefaultPublicFolderForField);
          }

          let fileI18n = file[I18N];

          if (fileI18n && collectionI18n) {
            fileI18n = getI18nDefaults(fileI18n, collectionI18n);
            file[I18N] = fileI18n;
          } else {
            fileI18n = undefined;
            delete file[I18N];
          }

          throwOnInvalidFileCollectionStructure(fileI18n);

          if (file.fields) {
            file.fields = setI18nDefaultsForFields(file.fields, Boolean(fileI18n));
          }
        }
      }

      if (!collection.sortable_fields) {
        collection.sortable_fields = selectDefaultSortableFields(
          collection as any,
          backend,
          hasIntegration(config, collection),
        );
      }

      collection.view_filters = (view_filters || []).map((filter, index) => {
        return {
          ...filter,
          id: `${filter.field}__${index}__${filter.pattern}`,
        };
      });

      collection.view_groups = (view_groups || []).map((group, index) => {
        return {
          ...group,
          id: `${group.field}__${index}__${group.pattern}`,
        };
      });

      // The global `editor` settings are defaults; a collection's own win.
      if (config.editor) {
        collection.editor = {
          preview: config.editor.preview,
          notes: config.editor.notes,
          ...collection.editor,
        };
      }
    }
  });
}

// Config is TypeScript-first: pass a config object to `CMS.init({ config })`
// (or set `window.CMS_CONFIG`). Loading YAML, JSON, or TOML config files
// requires the matching entry codec to be registered. The fat `/app` entry
// registers all three out of the box.

function getConfigCodec(format: ConfigFormat) {
  return getEntryCodec(format);
}

function missingConfigCodecError(format: ConfigFormat) {
  return new Error(
    `Loading a ${format.toUpperCase()} config requires the ${format} entry codec, and none is registered. `
      + `Either pass a config object to CMS.init({ config }) or register the codec: `
      + `import { ${format}EntryCodec } from 'decap-cms/entry-codecs/${format}'; `
      + `CMS.registerEntryCodec(${format}EntryCodec).`,
  );
}

export function parseConfig(data: string, format: ConfigFormat = 'yaml') {
  const codec = getConfigCodec(format);
  if (!codec) {
    throw missingConfigCodecError(format);
  }
  const config = (codec.parseConfig ?? codec.formatter.fromFile)(data) as Record<string, any>;
  if (
    typeof window !== 'undefined'
    && 'CMS_ENV' in window
    && typeof window.CMS_ENV === 'string'
    && config[window.CMS_ENV]
  ) {
    const configKeys = Object.keys(config[window.CMS_ENV]) as ReadonlyArray<keyof CmsConfig>;
    for (const key of configKeys) {
      config[key] = config[window.CMS_ENV][key] as CmsConfig[keyof CmsConfig];
    }
  }
  return config as Partial<CmsConfig>;
}

async function getConfigFile(file: string, hintedFormat: ConfigFormat | undefined, hasManualConfig: boolean) {
  const urlFormat = getConfigFormatFromUrl(file);
  if (urlFormat && !getConfigCodec(urlFormat)) {
    if (hasManualConfig) {
      console.log(`Skipping ${file}: no ${urlFormat} entry codec registered, using the provided config only.`);
      return {};
    }
    throw missingConfigCodecError(urlFormat);
  }
  const response = await fetch(file, { credentials: 'same-origin' }).catch(error => error as Error);
  if (response instanceof Error || response.status !== 200) {
    if (hasManualConfig) {
      return {};
    }
    const message = response instanceof Error ? response.message : response.status;
    throw new Error(`Failed to load ${file} (${message})`);
  }
  const contentType = response.headers.get('Content-Type') || '';
  const format = urlFormat
    ?? getConfigFormatFromContentType(contentType)
    ?? hintedFormat
    ?? 'yaml';
  if (!getConfigCodec(format)) {
    if (hasManualConfig) {
      console.log(`Skipping ${file}: no ${format} entry codec registered, using the provided config only.`);
      return {};
    }
    throw missingConfigCodecError(format);
  }
  return parseConfig(await response.text(), format);
}

export function configLoaded(config: CmsConfig) {
  return {
    type: CONFIG_SUCCESS,
    payload: config,
  } as const;
}

export function configLoading() {
  return {
    type: CONFIG_REQUEST,
  } as const;
}

export function configFailed(err: Error) {
  return {
    type: CONFIG_FAILURE,
    error: 'Error loading config',
    payload: err,
  } as const;
}

export async function detectProxyServer(localBackend?: boolean | CmsLocalBackend) {
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    ...(typeof localBackend === 'boolean' ? [] : localBackend?.allowed_hosts || []),
  ];

  if (!allowedHosts.includes(location.hostname) || !localBackend) {
    return {};
  }

  const defaultUrl = 'http://localhost:8081/api/v1';
  const proxyUrl = localBackend === true
    ? defaultUrl
    : localBackend.url || defaultUrl.replace('localhost', location.hostname);

  try {
    const { protocol } = new URL(proxyUrl);
    if (protocol !== 'http:' && protocol !== 'https:') {
      console.log(`Decap CMS local_backend url must use http or https, ignoring '${proxyUrl}'`);
      return {};
    }
  } catch {
    console.log(`Decap CMS local_backend url '${proxyUrl}' is not a valid URL`);
    return {};
  }

  try {
    console.log(`Looking for Decap CMS Proxy Server at '${proxyUrl}'`);
    const res = await fetch(`${proxyUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'info' }),
    });
    const { repo, publish_modes, type } = (await res.json()) as {
      repo?: string,
      publish_modes?: CmsPublishMode[],
      type?: string,
    };
    if (typeof repo === 'string' && Array.isArray(publish_modes) && typeof type === 'string') {
      console.log(`Detected Decap CMS Proxy Server at '${proxyUrl}' with repo: '${repo}'`);
      return { proxyUrl, publish_modes, type };
    } else {
      console.log(`Decap CMS Proxy Server not detected at '${proxyUrl}'`);
      return {};
    }
  } catch {
    console.log(`Decap CMS Proxy Server not detected at '${proxyUrl}'`);
    return {};
  }
}

function getPublishMode(config: CmsConfig, publishModes?: CmsPublishMode[], backendType?: string) {
  if (config.publish_mode && publishModes && !publishModes.includes(config.publish_mode)) {
    const newPublishMode = publishModes[0];
    console.log(
      `'${config.publish_mode}' is not supported by '${backendType}' backend, switching to '${newPublishMode}'`,
    );
    return newPublishMode;
  }

  return config.publish_mode;
}

export async function handleLocalBackend(originalConfig: CmsConfig) {
  if (!originalConfig.local_backend) {
    return originalConfig;
  }

  const {
    proxyUrl,
    publish_modes: publishModes,
    type: backendType,
  } = await detectProxyServer(originalConfig.local_backend);

  if (!proxyUrl) {
    return originalConfig;
  }

  return produce(originalConfig, config => {
    config.backend.name = 'proxy';
    config.backend.proxy_url = proxyUrl;

    const publishMode = config.publish_mode && getPublishMode(config, publishModes, backendType);
    if (publishMode) {
      config.publish_mode = publishMode;
    }
  });
}

export function loadConfig(manualConfig: Partial<CmsConfig> = {}, onLoad: () => unknown) {
  if (typeof window !== 'undefined' && 'CMS_CONFIG' in window && window.CMS_CONFIG) {
    return configLoaded(window.CMS_CONFIG as CmsConfig);
  }
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>) => {
    dispatch(configLoading());

    try {
      const configSource = getConfigSource();
      const hasManualConfig = !isEmpty(manualConfig);
      const configFile = manualConfig.load_config_file === false
        ? {}
        : await getConfigFile(configSource.url, configSource.format, hasManualConfig);

      // Merge manual config into the config-file one.
      const mergedConfig = deepMerge(configFile, manualConfig);

      validateConfig(mergedConfig as unknown as Record<string, unknown>);

      const withLocalBackend = await handleLocalBackend(mergedConfig);
      const normalizedConfig = normalizeConfig(withLocalBackend);

      const config = applyDefaults(normalizedConfig);

      dispatch(configLoaded(config));

      if (typeof onLoad === 'function') {
        onLoad();
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      dispatch(configFailed(error));
      throw error;
    }
  };
}

export type ConfigAction = ReturnType<
  typeof configLoading | typeof configLoaded | typeof configFailed
>;
