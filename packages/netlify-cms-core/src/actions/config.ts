import yaml from 'yaml';
import { fromJS } from 'immutable';
import deepmerge from 'deepmerge';
import { produce } from 'immer';
import { trimStart, trim, isEmpty } from 'lodash';

import { SIMPLE as SIMPLE_PUBLISH_MODE } from '../constants/publishModes';
import { validateConfig } from '../constants/configSchema';
import { selectDefaultSortableFields } from '../reducers/collections';
import { getIntegrations, selectIntegration } from '../reducers/integrations';
import { resolveBackend } from '../backend';
import { I18N, I18N_FIELD, I18N_STRUCTURE } from '../lib/i18n';
import { FILES, FOLDER } from '../constants/collectionTypes';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type {
  CmsCollection,
  CmsConfig,
  CmsField,
  CmsFieldBase,
  CmsFieldObject,
  CmsFieldList,
  CmsI18nConfig,
  CmsPublishMode,
  CmsLocalBackend,
  State,
} from '../types/redux';

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

function getConfigUrl() {
  const validTypes: { [type: string]: string } = {
    'text/yaml': 'yaml',
    'application/x-yaml': 'yaml',
  };
  const configLinkEl = document.querySelector<HTMLLinkElement>('link[rel="cms-config-url"]');
  if (configLinkEl && validTypes[configLinkEl.type] && configLinkEl.href) {
    console.log(`Using config file path: "${configLinkEl.href}"`);
    return configLinkEl.href;
  }
  return 'config.yml';
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
  editorComponents: 'editor_components',
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
    return { [snake]: (field as Record<string, unknown>)[camel] };
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
    const mergedI18n: CmsI18nConfig = deepmerge(defaultI18n, collectionOrFileI18n);
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
      `i18n locales '${i18n.locales.join(', ')}' are missing the default locale ${
        i18n.default_locale
      }`,
    );
  }
}

function hasIntegration(config: CmsConfig, collection: CmsCollection) {
  // TODO remove fromJS when Immutable is removed from the integrations state slice
  const integrations = getIntegrations(fromJS(config));
  const integration = selectIntegration(integrations, collection.name, 'listEntries');
  return !!integration;
}

export function normalizeConfig(config: CmsConfig) {
  const { collections = [] } = config;

  const normalizedCollections = collections.map(collection => {
    const { fields, files } = collection;

    let normalizedCollection = collection;
    if (fields) {
      const normalizedFields = traverseFieldsJS(fields, setSnakeCaseConfig);
      normalizedCollection = { ...normalizedCollection, fields: normalizedFields };
    }

    if (files) {
      const normalizedFiles = files.map(file => {
        const normalizedFileFields = traverseFieldsJS(file.fields, setSnakeCaseConfig);
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
          const metaField = {
            name: 'path',
            meta: true,
            required: true,
            ...meta.path,
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
          // TODO remove fromJS when Immutable is removed from the collections state slice
          fromJS(collection),
          backend,
          hasIntegration(config, collection),
        );
      }

      collection.view_filters = (view_filters || []).map(filter => {
        return {
          ...filter,
          id: `${filter.field}__${filter.pattern}`,
        };
      });

      collection.view_groups = (view_groups || []).map(group => {
        return {
          ...group,
          id: `${group.field}__${group.pattern}`,
        };
      });

      if (config.editor && !collection.editor) {
        collection.editor = { preview: config.editor.preview };
      }
    }
  });
}

export function parseConfig(data: string) {
  const config = yaml.parse(data, { maxAliasCount: -1, prettyErrors: true, merge: true });
  if (
    typeof window !== 'undefined' &&
    typeof window.CMS_ENV === 'string' &&
    config[window.CMS_ENV]
  ) {
    const configKeys = Object.keys(config[window.CMS_ENV]) as ReadonlyArray<keyof CmsConfig>;
    for (const key of configKeys) {
      config[key] = config[window.CMS_ENV][key] as CmsConfig[keyof CmsConfig];
    }
  }
  return config as Partial<CmsConfig>;
}

async function getConfigYaml(file: string, hasManualConfig: boolean) {
  const response = await fetch(file, { credentials: 'same-origin' }).catch(error => error as Error);
  if (response instanceof Error || response.status !== 200) {
    if (hasManualConfig) {
      return {};
    }
    const message = response instanceof Error ? response.message : response.status;
    throw new Error(`Failed to load config.yml (${message})`);
  }
  const contentType = response.headers.get('Content-Type') || 'Not-Found';
  const isYaml = contentType.indexOf('yaml') !== -1;
  if (!isYaml) {
    console.log(`Response for ${file} was not yaml. (Content-Type: ${contentType})`);
    if (hasManualConfig) {
      return {};
    }
  }
  return parseConfig(await response.text());
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
  const proxyUrl =
    localBackend === true
      ? defaultUrl
      : localBackend.url || defaultUrl.replace('localhost', location.hostname);

  try {
    console.log(`Looking for Netlify CMS Proxy Server at '${proxyUrl}'`);
    const res = await fetch(`${proxyUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'info' }),
    });
    const { repo, publish_modes, type } = (await res.json()) as {
      repo?: string;
      publish_modes?: CmsPublishMode[];
      type?: string;
    };
    if (typeof repo === 'string' && Array.isArray(publish_modes) && typeof type === 'string') {
      console.log(`Detected Netlify CMS Proxy Server at '${proxyUrl}' with repo: '${repo}'`);
      return { proxyUrl, publish_modes, type };
    } else {
      console.log(`Netlify CMS Proxy Server not detected at '${proxyUrl}'`);
      return {};
    }
  } catch {
    console.log(`Netlify CMS Proxy Server not detected at '${proxyUrl}'`);
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

    if (config.publish_mode) {
      config.publish_mode = getPublishMode(config, publishModes, backendType);
    }
  });
}

export function loadConfig(manualConfig: Partial<CmsConfig> = {}, onLoad: () => unknown) {
  if (window.CMS_CONFIG) {
    return configLoaded(window.CMS_CONFIG);
  }
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>) => {
    dispatch(configLoading());

    try {
      const configUrl = getConfigUrl();
      const hasManualConfig = !isEmpty(manualConfig);
      const configYaml =
        manualConfig.load_config_file === false
          ? {}
          : await getConfigYaml(configUrl, hasManualConfig);

      // Merge manual config into the config.yml one
      const mergedConfig = deepmerge(configYaml, manualConfig);

      validateConfig(mergedConfig);

      const withLocalBackend = await handleLocalBackend(mergedConfig);
      const normalizedConfig = normalizeConfig(withLocalBackend);

      const config = applyDefaults(normalizedConfig);

      dispatch(configLoaded(config));

      if (typeof onLoad === 'function') {
        onLoad();
      }
    } catch (err) {
      dispatch(configFailed(err));
      throw err;
    }
  };
}

export type ConfigAction = ReturnType<
  typeof configLoading | typeof configLoaded | typeof configFailed
>;
