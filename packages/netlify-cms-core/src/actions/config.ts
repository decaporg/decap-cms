import yaml from 'yaml';
import { produce } from 'immer';
import { trimStart, trim } from 'lodash';
import deepmerge from 'deepmerge';
import { AnyAction } from 'redux';
import { authenticateUser } from './auth';
import * as publishModes from '../constants/publishModes';
import { validateConfig } from '../constants/configSchema';
import { resolveBackend } from '../backend';
import { I18N, I18N_FIELD, I18N_STRUCTURE } from '../lib/i18n';
import {
  CmsCollection,
  CmsCollectionFile,
  CmsConfig,
  CmsField,
  CmsI18nConfig,
  CmsPublishMode,
  State,
} from '../types/redux';
import { Entries } from '../types/helpers';
import { ThunkDispatch } from 'redux-thunk';
import { FILES, FOLDER } from '../constants/collectionTypes';
import { throwIfNotDraft } from '../lib/immerUtils';
import { traverseFields, selectDefaultSortableFields } from '../lib/fieldsUtils';

export const CONFIG_REQUEST = 'CONFIG_REQUEST';
export const CONFIG_SUCCESS = 'CONFIG_SUCCESS';
export const CONFIG_FAILURE = 'CONFIG_FAILURE';
export const CONFIG_MERGE = 'CONFIG_MERGE';

const throwOnInvalidFileCollectionStructure = (i18n?: CmsI18nConfig) => {
  if (i18n && i18n.structure !== I18N_STRUCTURE.SINGLE_FILE) {
    throw new Error(
      `i18n configuration for files collections is limited to ${I18N_STRUCTURE.SINGLE_FILE} structure`,
    );
  }
};

const throwOnMissingDefaultLocale = (i18n?: CmsI18nConfig) => {
  if (i18n && i18n.default_locale && !i18n.locales.includes(i18n.default_locale)) {
    throw new Error(
      `i18n locales '${i18n.locales.join(', ')}' are missing the default locale ${
        i18n.default_locale
      }`,
    );
  }
};

const getConfigUrl = () => {
  const validTypes: { [type: string]: string | undefined } = {
    'text/yaml': 'yaml',
    'application/x-yaml': 'yaml',
  } as const;
  const configLinkEl = document.querySelector<HTMLLinkElement>('link[rel="cms-config-url"]');
  const configLinkType = configLinkEl && configLinkEl.getAttribute('type');
  const configLinkHref = configLinkEl && configLinkEl.getAttribute('href');
  const configUrl =
    configLinkType && configLinkHref && validTypes[configLinkType] ? configLinkHref : 'config.yml';
  console.log(`Using config file path: "${configUrl}"`);
  return configUrl;
};

const setDefaultPublicFolder = <T extends CmsCollection | CmsCollectionFile | CmsField>(
  collectionOrField: T,
) => {
  throwIfNotDraft(collectionOrField);
  if ('media_folder' in collectionOrField && !collectionOrField.public_folder) {
    collectionOrField.public_folder = collectionOrField.media_folder;
  }
};

const setSnakeCaseConfig = (field: CmsField) => {
  throwIfNotDraft(field);

  // Mapping between existing camelCase and its snake_case counterpart
  const widgetKeyMap = {
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

  const widgetKeyMapEntries = Object.entries(widgetKeyMap) as Entries<typeof widgetKeyMap>;
  for (const [camel, snake] of widgetKeyMapEntries) {
    if (camel in field) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore seems like it's impossible to make TS happy in this case
      field[snake] = field[camel];
      console.warn(
        `Field ${field.name} is using a deprecated configuration '${camel}'. Please use '${snake}'`,
      );
    }
  }
};

const setI18nField = (field: CmsField) => {
  throwIfNotDraft(field);
  if (field[I18N] === true) {
    field[I18N] = I18N_FIELD.TRANSLATE;
  } else if (field[I18N] === false || !field[I18N]) {
    field[I18N] = I18N_FIELD.NONE;
  }
};

const setI18nDefaults = (
  collectionOrFile: CmsCollection | CmsCollectionFile,
  defaultI18n?: CmsI18nConfig,
) => {
  throwIfNotDraft(collectionOrFile);
  const collectionOrFileI18n = collectionOrFile[I18N];
  if (collectionOrFileI18n) {
    if (defaultI18n) {
      if (typeof collectionOrFileI18n === 'boolean') {
        if (collectionOrFileI18n) {
          collectionOrFile[I18N] = defaultI18n;
        } else {
          delete collectionOrFile[I18N];
        }
      } else {
        const locales = collectionOrFileI18n.locales || defaultI18n.locales;
        const defaultLocale = collectionOrFileI18n.default_locale || locales[0];
        const mergedI18n = deepmerge(defaultI18n, collectionOrFileI18n);
        mergedI18n.locales = locales;
        mergedI18n.default_locale = defaultLocale;
        collectionOrFile[I18N] = mergedI18n;

        throwOnMissingDefaultLocale(mergedI18n);
      }
    }

    // set default values for i18n fields
    if (collectionOrFile.fields) {
      traverseFields(collectionOrFile.fields, setI18nField);
    }
  } else {
    delete collectionOrFile[I18N];
    if (collectionOrFile.fields) {
      traverseFields(collectionOrFile.fields, field => {
        delete field[I18N];
      });
    }
  }
};

export function normalizeConfig(originalConfig: CmsConfig) {
  return produce(originalConfig, config => {
    const collections = config.collections || [];
    for (let i = 0, l = collections.length; i < l; i += 1) {
      const collection = collections[i];
      const { folder, files } = collection;

      if (folder) {
        if (collection.fields) {
          traverseFields(collection.fields, setSnakeCaseConfig);
        }
      }

      if (files) {
        for (let j = 0, ll = files.length; j < ll; j += 1) {
          const file = files[j];
          traverseFields(file.fields, setSnakeCaseConfig);
        }
      }

      if (collection.sortableFields) {
        collection.sortable_fields = collection.sortableFields;
        delete collection.sortableFields;

        console.warn(
          `Collection ${collection.name} is using a deprecated configuration 'sortableFields'. Please use 'sortable_fields'`,
        );
      }
    }
  });
}

export function applyDefaults(originalConfig: CmsConfig) {
  return produce(originalConfig, config => {
    config.publish_mode = config.publish_mode || publishModes.SIMPLE;
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
      throwOnMissingDefaultLocale(i18n);
    }

    const backend = resolveBackend(config);

    // Strip leading slash from collection folders and files
    for (let i = 0, l = config.collections.length; i < l; i += 1) {
      const collection = config.collections[i];

      if (!('publish' in collection)) {
        collection.publish = true;
      }

      setI18nDefaults(collection, i18n);

      const { folder, files, view_filters, view_groups, meta } = collection;

      if (folder) {
        collection.type = FOLDER;

        if (collection.path && !collection.media_folder) {
          // default value for media folder when using the path config
          collection.media_folder = '';
        }

        setDefaultPublicFolder(collection);

        if (collection.fields) {
          traverseFields(collection.fields, setDefaultPublicFolder);
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

        // after we invoked setI18nDefaults,
        // i18n property can't be boolean anymore
        const collectionI18n = collection[I18N] as CmsI18nConfig | undefined;
        throwOnInvalidFileCollectionStructure(collectionI18n);

        delete collection.nested;
        delete collection.meta;

        for (let j = 0, ll = files.length; j < ll; j += 1) {
          const file = files[j];
          file.file = trimStart(file.file, '/');
          setDefaultPublicFolder(file);
          traverseFields(file.fields, setDefaultPublicFolder);
          setI18nDefaults(file, collectionI18n);
          // after we invoked setI18nDefaults,
          // i18n property can't be boolean anymore
          const fileI18n = file[I18N] as CmsI18nConfig | undefined;
          throwOnInvalidFileCollectionStructure(fileI18n);
        }
      }

      if (!collection.sortable_fields) {
        collection.sortable_fields = selectDefaultSortableFields(collection, backend);
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
    const configEntries = Object.entries(config[window.CMS_ENV]) as ReadonlyArray<
      [keyof CmsConfig, CmsConfig[keyof CmsConfig]]
    >;
    for (const [key, value] of configEntries) {
      config[key] = value;
    }
  }
  return config as Partial<CmsConfig>;
}

async function getConfig(file: string) {
  const response = await fetch(file, { credentials: 'same-origin' });
  if (!response.ok || response.status !== 200) {
    throw new Error(`Failed to load config.yml (${response.status})`);
  }
  const contentType = response.headers.get('Content-Type') || 'Not-Found';
  const isYaml = contentType.indexOf('yaml') !== -1;
  if (!isYaml) {
    throw new Error(`Response for ${file} was not yaml. (Content-Type: ${contentType})`);
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

export function mergeConfig(config: CmsConfig) {
  return { type: CONFIG_MERGE, payload: config } as const;
}

export async function detectProxyServer(localBackend?: CmsConfig['local_backend']) {
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    ...(localBackend && typeof localBackend === 'object' ? localBackend.allowed_hosts || [] : []),
  ];

  if (!allowedHosts.includes(location.hostname)) {
    return {};
  }

  let proxyUrl;
  const defaultUrl = 'http://localhost:8081/api/v1';
  if (localBackend) {
    if (typeof localBackend === 'boolean') {
      proxyUrl = defaultUrl;
    } else {
      proxyUrl = localBackend.url || defaultUrl.replace('localhost', location.hostname);
    }
  }
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

export async function handleLocalBackend(originalConfig: CmsConfig) {
  if (!originalConfig.local_backend) {
    return originalConfig;
  }

  const { proxyUrl, publish_modes, type } = await detectProxyServer(originalConfig.local_backend);

  if (!proxyUrl) {
    return originalConfig;
  }

  return produce(originalConfig, config => {
    config.backend.name = 'proxy';
    config.backend.proxy_url = proxyUrl;

    if (config.publish_mode && publish_modes && !publish_modes.includes(config.publish_mode)) {
      const newPublishMode = publish_modes[0];
      config.publish_mode = newPublishMode;
      console.log(
        [
          `'${config.publish_mode}' is not supported by '${type}' backend,`,
          `switching to '${newPublishMode}'`,
        ].join(''),
      );
    }
  });
}

export function loadConfig() {
  if (window.CMS_CONFIG) {
    return configLoaded(window.CMS_CONFIG);
  }
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    dispatch(configLoading());

    try {
      const state = getState();
      const preloadedConfig = state.config;
      const configUrl = getConfigUrl();
      const loadedConfig =
        preloadedConfig && preloadedConfig.load_config_file === false
          ? {}
          : await getConfig(configUrl);

      /**
       * Merge any existing configuration so the result can be validated.
       */
      let config = deepmerge(preloadedConfig, loadedConfig);

      validateConfig(config);

      config = applyDefaults(config);
      config = await handleLocalBackend(config);
      config = normalizeConfig(config);

      dispatch(configLoaded(config));
      dispatch(authenticateUser());
    } catch (err) {
      dispatch(configFailed(err));
      throw err;
    }
  };
}

export type ConfigAction = ReturnType<
  typeof configLoading | typeof configLoaded | typeof configFailed | typeof mergeConfig
>;
