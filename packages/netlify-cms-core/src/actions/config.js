import yaml from 'yaml';
import { fromJS } from 'immutable';
import deepmerge from 'deepmerge';
import { produce } from 'immer';
import { trimStart, trim, get, isPlainObject, isEmpty } from 'lodash';
import { SIMPLE as SIMPLE_PUBLISH_MODE } from '../constants/publishModes';
import { validateConfig } from '../constants/configSchema';
import { selectDefaultSortableFields } from '../reducers/collections';
import { getIntegrations, selectIntegration } from '../reducers/integrations';
import { resolveBackend } from '../backend';
import { I18N, I18N_FIELD, I18N_STRUCTURE } from '../lib/i18n';
import { FILES, FOLDER } from '../constants/collectionTypes';

export const CONFIG_REQUEST = 'CONFIG_REQUEST';
export const CONFIG_SUCCESS = 'CONFIG_SUCCESS';
export const CONFIG_FAILURE = 'CONFIG_FAILURE';

function traverseFieldsJS(fields, updater) {
  return fields.map(field => {
    let newField = updater(field);
    if (newField.fields) {
      newField = { ...newField, fields: traverseFieldsJS(newField.fields, updater) };
    } else if (newField.field) {
      newField = { ...newField, field: traverseFieldsJS([newField.field], updater)[0] };
    } else if (newField.types) {
      newField = { ...newField, types: traverseFieldsJS(newField.types, updater) };
    }

    return newField;
  });
}

function getConfigUrl() {
  const validTypes = { 'text/yaml': 'yaml', 'application/x-yaml': 'yaml' };
  const configLinkEl = document.querySelector('link[rel="cms-config-url"]');
  const isValidLink = configLinkEl && validTypes[configLinkEl.type] && get(configLinkEl, 'href');
  if (isValidLink) {
    const link = get(configLinkEl, 'href');
    console.log(`Using config file path: "${link}"`);
    return link;
  }
  return 'config.yml';
}

function setDefaultPublicFolderForField(field) {
  if ('media_folder' in field && !field.public_folder) {
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
};

function setSnakeCaseConfig(field) {
  const deprecatedKeys = Object.keys(WIDGET_KEY_MAP).filter(camel => camel in field);
  const snakeValues = deprecatedKeys.map(camel => {
    const snake = WIDGET_KEY_MAP[camel];
    console.warn(
      `Field ${field.name} is using a deprecated configuration '${camel}'. Please use '${snake}'`,
    );
    return { [snake]: field[camel] };
  });

  return Object.assign({}, field, ...snakeValues);
}

function setI18nField(field) {
  if (field[I18N] === true) {
    return { ...field, [I18N]: I18N_FIELD.TRANSLATE };
  } else if (field[I18N] === false || !field[I18N]) {
    return { ...field, [I18N]: I18N_FIELD.NONE };
  }
  return field;
}

function getI18nDefaults(collectionOrFileI18n, defaultI18n) {
  if (typeof collectionOrFileI18n === 'boolean') {
    return defaultI18n;
  } else {
    const locales = collectionOrFileI18n.locales || defaultI18n.locales;
    const defaultLocale = collectionOrFileI18n.default_locale || locales[0];
    const mergedI18n = deepmerge(defaultI18n, collectionOrFileI18n);
    mergedI18n.locales = locales;
    mergedI18n.default_locale = defaultLocale;
    throwOnMissingDefaultLocale(mergedI18n);
    return mergedI18n;
  }
}

function setI18nDefaultsForFields(collectionOrFileFields, hasI18n) {
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

function throwOnInvalidFileCollectionStructure(i18n) {
  if (i18n && i18n.structure !== I18N_STRUCTURE.SINGLE_FILE) {
    throw new Error(
      `i18n configuration for files collections is limited to ${I18N_STRUCTURE.SINGLE_FILE} structure`,
    );
  }
}

function throwOnMissingDefaultLocale(i18n) {
  if (i18n && i18n.default_locale && !i18n.locales.includes(i18n.default_locale)) {
    throw new Error(
      `i18n locales '${i18n.locales.join(', ')}' are missing the default locale ${
        i18n.default_locale
      }`,
    );
  }
}

function hasIntegration(config, collection) {
  // TODO remove fromJS when Immutable is removed from the integrations state slice
  const integrations = getIntegrations(fromJS(config));
  const integration = selectIntegration(integrations, collection.name, 'listEntries');
  return !!integration;
}

export function normalizeConfig(config) {
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

export function applyDefaults(originalConfig) {
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
    const hasI18n = Boolean(i18n);
    if (hasI18n) {
      i18n.default_locale = i18n.default_locale || i18n.locales[0];
    }

    throwOnMissingDefaultLocale(i18n);

    const backend = resolveBackend(fromJS(config));

    for (const collection of config.collections) {
      if (!('publish' in collection)) {
        collection.publish = true;
      }

      const collectionHasI18n = Boolean(collection[I18N]);
      if (hasI18n && collectionHasI18n) {
        collection[I18N] = getI18nDefaults(collection[I18N], i18n);
      } else {
        delete collection[I18N];
      }

      if (collection.fields) {
        collection.fields = setI18nDefaultsForFields(collection.fields, collectionHasI18n);
      }

      const { folder, files, view_filters, view_groups, meta } = collection;

      if (folder) {
        collection.type = FOLDER;

        if (collection.path && !collection.media_folder) {
          // default value for media folder when using the path config
          collection.media_folder = '';
        }

        if ('media_folder' in collection && !collection.public_folder) {
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

        // after we invoked setI18nDefaults,
        // i18n property can't be boolean anymore
        const collectionI18n = collection[I18N];
        throwOnInvalidFileCollectionStructure(collectionI18n);

        delete collection.nested;
        delete collection.meta;

        for (const file of files) {
          file.file = trimStart(file.file, '/');

          if ('media_folder' in file && !file.public_folder) {
            file.public_folder = file.media_folder;
          }

          if (file.fields) {
            file.fields = traverseFieldsJS(file.fields, setDefaultPublicFolderForField);
          }

          const fileHasI18n = Boolean(file[I18N]);

          if (fileHasI18n) {
            if (collectionI18n) {
              file[I18N] = getI18nDefaults(file[I18N], collectionI18n);
            }
          } else {
            delete file[I18N];
          }

          if (file.fields) {
            file.fields = setI18nDefaultsForFields(file.fields, fileHasI18n);
          }

          // after we invoked setI18nDefaults,
          // i18n property can't be boolean anymore
          const fileI18n = file[I18N];
          throwOnInvalidFileCollectionStructure(fileI18n);
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

export function parseConfig(data) {
  const config = yaml.parse(data, { maxAliasCount: -1, prettyErrors: true, merge: true });
  if (typeof CMS_ENV === 'string' && config[CMS_ENV]) {
    Object.keys(config[CMS_ENV]).forEach(key => {
      config[key] = config[CMS_ENV][key];
    });
  }
  return config;
}

async function getConfigYaml(file, hasManualConfig) {
  const response = await fetch(file, { credentials: 'same-origin' }).catch(err => err);
  if (response instanceof Error || response.status !== 200) {
    if (hasManualConfig) return parseConfig('');
    throw new Error(`Failed to load config.yml (${response.status || response})`);
  }
  const contentType = response.headers.get('Content-Type') || 'Not-Found';
  const isYaml = contentType.indexOf('yaml') !== -1;
  if (!isYaml) {
    console.log(`Response for ${file} was not yaml. (Content-Type: ${contentType})`);
    if (hasManualConfig) return parseConfig('');
  }
  return parseConfig(await response.text());
}

export function configLoaded(config) {
  return {
    type: CONFIG_SUCCESS,
    payload: config,
  };
}

export function configLoading() {
  return {
    type: CONFIG_REQUEST,
  };
}

export function configFailed(err) {
  return {
    type: CONFIG_FAILURE,
    error: 'Error loading config',
    payload: err,
  };
}

export async function detectProxyServer(localBackend) {
  const allowedHosts = ['localhost', '127.0.0.1', ...(localBackend?.allowed_hosts || [])];
  if (allowedHosts.includes(location.hostname)) {
    let proxyUrl;
    const defaultUrl = 'http://localhost:8081/api/v1';
    if (localBackend === true) {
      proxyUrl = defaultUrl;
    } else if (isPlainObject(localBackend)) {
      proxyUrl = localBackend.url || defaultUrl.replace('localhost', location.hostname);
    }
    try {
      console.log(`Looking for Netlify CMS Proxy Server at '${proxyUrl}'`);
      const { repo, publish_modes, type } = await fetch(`${proxyUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'info' }),
      }).then(res => res.json());
      if (typeof repo === 'string' && Array.isArray(publish_modes) && typeof type === 'string') {
        console.log(`Detected Netlify CMS Proxy Server at '${proxyUrl}' with repo: '${repo}'`);
        return { proxyUrl, publish_modes, type };
      }
    } catch {
      console.log(`Netlify CMS Proxy Server not detected at '${proxyUrl}'`);
    }
  }
  return {};
}

function getPublishMode(config, publishModes, backendType) {
  if (config.publish_mode && publishModes && !publishModes.includes(config.publish_mode)) {
    const newPublishMode = publishModes[0];
    console.log(
      `'${config.publish_mode}' is not supported by '${backendType}' backend, switching to '${newPublishMode}'`,
    );
    return newPublishMode;
  }

  return config.publish_mode;
}

export async function handleLocalBackend(config) {
  if (!config.local_backend) {
    return config;
  }

  const { proxyUrl, publish_modes: publishModes, type: backendType } = await detectProxyServer(
    config.local_backend,
  );

  if (!proxyUrl) {
    return config;
  }

  const publishMode = getPublishMode(config, publishModes, backendType);
  return {
    ...config,
    ...(publishMode && { publish_mode: publishMode }),
    backend: { ...config.backend, name: 'proxy', proxy_url: proxyUrl },
  };
}

export function loadConfig(manualConfig = {}, onLoad) {
  if (window.CMS_CONFIG) {
    return configLoaded(fromJS(window.CMS_CONFIG));
  }
  return async dispatch => {
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

      dispatch(configLoaded(fromJS(config)));

      if (typeof onLoad === 'function') {
        onLoad();
      }
    } catch (err) {
      dispatch(configFailed(err));
      throw err;
    }
  };
}
