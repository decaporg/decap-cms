import yaml from 'yaml';
import { Map, fromJS } from 'immutable';
import deepmerge from 'deepmerge';
import { trimStart, trim, get, isPlainObject, isEmpty } from 'lodash';
import { SIMPLE as SIMPLE_PUBLISH_MODE } from '../constants/publishModes';
import { validateConfig } from '../constants/configSchema';
import { selectDefaultSortableFields, traverseFields } from '../reducers/collections';
import { getIntegrations, selectIntegration } from '../reducers/integrations';
import { resolveBackend } from '../backend';
import { I18N, I18N_FIELD, I18N_STRUCTURE } from '../lib/i18n';

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

function setDefaultPublicFolder(map) {
  if (map.has('media_folder') && !map.has('public_folder')) {
    map = map.set('public_folder', map.get('media_folder'));
  }
  return map;
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
  if (field.get(I18N) === true) {
    field = field.set(I18N, I18N_FIELD.TRANSLATE);
  } else if (field.get(I18N) === false || !field.has(I18N)) {
    field = field.set(I18N, I18N_FIELD.NONE);
  }
  return field;
}

function setI18nDefaults(defaultI18n, collectionOrFile) {
  if (defaultI18n && collectionOrFile.has(I18N)) {
    const collectionOrFileI18n = collectionOrFile.get(I18N);
    if (collectionOrFileI18n === true) {
      collectionOrFile = collectionOrFile.set(I18N, defaultI18n);
    } else if (collectionOrFileI18n === false) {
      collectionOrFile = collectionOrFile.delete(I18N);
    } else {
      const locales = collectionOrFileI18n.get('locales', defaultI18n.get('locales'));
      const defaultLocale = collectionOrFileI18n.get(
        'default_locale',
        collectionOrFileI18n.has('locales') ? locales.first() : defaultI18n.get('default_locale'),
      );
      collectionOrFile = collectionOrFile.set(I18N, defaultI18n.merge(collectionOrFileI18n));
      collectionOrFile = collectionOrFile.setIn([I18N, 'locales'], locales);
      collectionOrFile = collectionOrFile.setIn([I18N, 'default_locale'], defaultLocale);

      throwOnMissingDefaultLocale(collectionOrFile.get(I18N));
    }

    if (collectionOrFileI18n !== false) {
      // set default values for i18n fields
      if (collectionOrFile.has('fields')) {
        collectionOrFile = collectionOrFile.set(
          'fields',
          traverseFields(collectionOrFile.get('fields'), setI18nField),
        );
      }
    }
  } else {
    collectionOrFile = collectionOrFile.delete(I18N);
    if (collectionOrFile.has('fields')) {
      collectionOrFile = collectionOrFile.set(
        'fields',
        traverseFields(collectionOrFile.get('fields'), field => field.delete(I18N)),
      );
    }
  }
  return collectionOrFile;
}

function throwOnInvalidFileCollectionStructure(i18n) {
  if (i18n && i18n.get('structure') !== I18N_STRUCTURE.SINGLE_FILE) {
    throw new Error(
      `i18n configuration for files collections is limited to ${I18N_STRUCTURE.SINGLE_FILE} structure`,
    );
  }
}

function throwOnMissingDefaultLocale(i18n) {
  if (i18n && !i18n.get('locales').includes(i18n.get('default_locale'))) {
    throw new Error(
      `i18n locales '${i18n.get('locales').join(', ')}' are missing the default locale ${i18n.get(
        'default_locale',
      )}`,
    );
  }
}

function setViewPatternsDefaults(key, collection) {
  if (!collection.has(key)) {
    collection = collection.set(key, fromJS([]));
  } else {
    collection = collection.set(
      key,
      collection.get(key).map(v => v.set('id', `${v.get('field')}__${v.get('pattern')}`)),
    );
  }

  return collection;
}

const defaults = {
  publish_mode: SIMPLE_PUBLISH_MODE,
};

function hasIntegration(config, collection) {
  const integrations = getIntegrations(config);
  const integration = selectIntegration(integrations, collection.get('name'), 'listEntries');
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

export function applyDefaults(config) {
  return Map(defaults)
    .mergeDeep(config)
    .withMutations(map => {
      // Use `site_url` as default `display_url`.
      if (!map.get('display_url') && map.get('site_url')) {
        map.set('display_url', map.get('site_url'));
      }

      // Use media_folder as default public_folder.
      const defaultPublicFolder = `/${trimStart(map.get('media_folder'), '/')}`;
      if (!map.has('public_folder')) {
        map.set('public_folder', defaultPublicFolder);
      }

      // default values for the slug config
      if (!map.getIn(['slug', 'encoding'])) {
        map.setIn(['slug', 'encoding'], 'unicode');
      }

      if (!map.getIn(['slug', 'clean_accents'])) {
        map.setIn(['slug', 'clean_accents'], false);
      }

      if (!map.getIn(['slug', 'sanitize_replacement'])) {
        map.setIn(['slug', 'sanitize_replacement'], '-');
      }

      let i18n = config.get(I18N);
      i18n = i18n?.set('default_locale', i18n.get('default_locale', i18n.get('locales').first()));
      throwOnMissingDefaultLocale(i18n);

      // Strip leading slash from collection folders and files
      map.set(
        'collections',
        map.get('collections').map(collection => {
          if (!collection.has('publish')) {
            collection = collection.set('publish', true);
          }

          collection = setI18nDefaults(i18n, collection);

          const folder = collection.get('folder');
          if (folder) {
            if (collection.has('path') && !collection.has('media_folder')) {
              // default value for media folder when using the path config
              collection = collection.set('media_folder', '');
            }
            collection = setDefaultPublicFolder(collection);
            collection = collection.set(
              'fields',
              traverseFields(collection.get('fields'), setDefaultPublicFolder),
            );
            collection = collection.set('folder', trim(folder, '/'));
            if (collection.has('meta')) {
              const fields = collection.get('fields');
              const metaFields = [];
              collection.get('meta').forEach((value, key) => {
                const field = value.withMutations(map => {
                  map.set('name', key);
                  map.set('meta', true);
                  map.set('required', true);
                });
                metaFields.push(field);
              });
              collection = collection.set('fields', fromJS([]).concat(metaFields, fields));
            } else {
              collection = collection.set('meta', Map());
            }
          }

          const files = collection.get('files');
          if (files) {
            const collectionI18n = collection.get(I18N);
            throwOnInvalidFileCollectionStructure(collectionI18n);

            collection = collection.delete('nested');
            collection = collection.delete('meta');
            collection = collection.set(
              'files',
              files.map(file => {
                file = file.set('file', trimStart(file.get('file'), '/'));
                file = setDefaultPublicFolder(file);
                file = file.set(
                  'fields',
                  traverseFields(file.get('fields'), setDefaultPublicFolder),
                );
                file = setI18nDefaults(collectionI18n, file);
                throwOnInvalidFileCollectionStructure(file.get(I18N));
                return file;
              }),
            );
          }

          if (!collection.has('sortable_fields')) {
            const backend = resolveBackend(config);
            const defaultSortable = selectDefaultSortableFields(
              collection,
              backend,
              hasIntegration(map, collection),
            );
            collection = collection.set('sortable_fields', fromJS(defaultSortable));
          }

          collection = setViewPatternsDefaults('view_filters', collection);
          collection = setViewPatternsDefaults('view_groups', collection);

          if (map.hasIn(['editor', 'preview']) && !collection.has('editor')) {
            collection = collection.setIn(['editor', 'preview'], map.getIn(['editor', 'preview']));
          }

          return collection;
        }),
      );
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

      const config = applyDefaults(fromJS(normalizedConfig));

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
