import yaml from 'yaml';
import { Map, fromJS } from 'immutable';
import { trimStart, trim, get, isPlainObject } from 'lodash';
import { authenticateUser } from 'Actions/auth';
import * as publishModes from 'Constants/publishModes';
import { validateConfig } from 'Constants/configSchema';
import { selectDefaultSortableFields, traverseFields } from '../reducers/collections';
import { resolveBackend } from 'coreSrc/backend';
import { I18N, I18N_FIELD } from '../lib/i18n';

export const CONFIG_REQUEST = 'CONFIG_REQUEST';
export const CONFIG_SUCCESS = 'CONFIG_SUCCESS';
export const CONFIG_FAILURE = 'CONFIG_FAILURE';
export const CONFIG_MERGE = 'CONFIG_MERGE';

const getConfigUrl = () => {
  const validTypes = { 'text/yaml': 'yaml', 'application/x-yaml': 'yaml' };
  const configLinkEl = document.querySelector('link[rel="cms-config-url"]');
  const isValidLink = configLinkEl && validTypes[configLinkEl.type] && get(configLinkEl, 'href');
  if (isValidLink) {
    const link = get(configLinkEl, 'href');
    console.log(`Using config file path: "${link}"`);
    return link;
  }
  return 'config.yml';
};

const setDefaultPublicFolder = map => {
  if (map.has('media_folder') && !map.has('public_folder')) {
    map = map.set('public_folder', map.get('media_folder'));
  }
  return map;
};

const setSnakeCaseConfig = field => {
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
  };

  Object.entries(widgetKeyMap).forEach(([camel, snake]) => {
    if (field.has(camel)) {
      field = field.set(snake, field.get(camel));
      console.warn(
        `Field ${field.get(
          'name',
        )} is using a deprecated configuration '${camel}'. Please use '${snake}'`,
      );
    }
  });
  return field;
};

const setI18nField = field => {
  if (field.get(I18N) === true) {
    field = field.set(I18N, I18N_FIELD.TRANSLATE);
  } else if (field.get(I18N) === false || !field.has(I18N)) {
    field = field.set(I18N, I18N_FIELD.NONE);
  }
  return field;
};

const setI18nDefaults = (i18n, collection) => {
  if (i18n && collection.has(I18N)) {
    const collectionI18n = collection.get(I18N);
    if (collectionI18n === true) {
      collection = collection.set(I18N, i18n);
    } else if (collectionI18n === false) {
      collection = collection.delete(I18N);
    } else {
      const locales = collectionI18n.get('locales', i18n.get('locales'));
      const defaultLocale = collectionI18n.get(
        'default_locale',
        collectionI18n.has('locales') ? locales.first() : i18n.get('default_locale'),
      );
      collection = collection.set(I18N, i18n.merge(collectionI18n));
      collection = collection.setIn([I18N, 'locales'], locales);
      collection = collection.setIn([I18N, 'default_locale'], defaultLocale);

      throwOnMissingDefaultLocale(collection.get(I18N));
    }

    if (collectionI18n !== false) {
      // set default values for i18n fields
      collection = collection.set('fields', traverseFields(collection.get('fields'), setI18nField));
    }
  } else {
    collection = collection.delete(I18N);
    collection = collection.set(
      'fields',
      traverseFields(collection.get('fields'), field => field.delete(I18N)),
    );
  }
  return collection;
};

const throwOnMissingDefaultLocale = i18n => {
  if (i18n && !i18n.get('locales').includes(i18n.get('default_locale'))) {
    throw new Error(
      `i18n locales '${i18n.get('locales').join(', ')}' are missing the default locale ${i18n.get(
        'default_locale',
      )}`,
    );
  }
};

const setViewPatternsDefaults = (key, collection) => {
  if (!collection.has(key)) {
    collection = collection.set(key, fromJS([]));
  } else {
    collection = collection.set(
      key,
      collection.get(key).map(v => v.set('id', `${v.get('field')}__${v.get('pattern')}`)),
    );
  }

  return collection;
};

const defaults = {
  publish_mode: publishModes.SIMPLE,
};

export function normalizeConfig(config) {
  return Map(config).withMutations(map => {
    map.set(
      'collections',
      map.get('collections').map(collection => {
        const folder = collection.get('folder');
        if (folder) {
          collection = collection.set(
            'fields',
            traverseFields(collection.get('fields'), setSnakeCaseConfig),
          );
        }

        const files = collection.get('files');
        if (files) {
          collection = collection.set(
            'files',
            files.map(file => {
              file = file.set('fields', traverseFields(file.get('fields'), setSnakeCaseConfig));
              return file;
            }),
          );
        }

        if (collection.has('sortableFields')) {
          collection = collection
            .set('sortable_fields', collection.get('sortableFields'))
            .delete('sortableFields');

          console.warn(
            `Collection ${collection.get(
              'name',
            )} is using a deprecated configuration 'sortableFields'. Please use 'sortable_fields'`,
          );
        }

        return collection;
      }),
    );
  });
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

            collection = setI18nDefaults(i18n, collection);
          }

          const files = collection.get('files');
          if (files) {
            if (i18n && collection.has(I18N)) {
              throw new Error('i18n configuration is not supported for files collection');
            }
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
                return file;
              }),
            );
          }

          if (!collection.has('sortable_fields')) {
            const backend = resolveBackend(config);
            const defaultSortable = selectDefaultSortableFields(collection, backend);
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

function mergePreloadedConfig(preloadedConfig, loadedConfig) {
  const map = fromJS(loadedConfig) || Map();
  return preloadedConfig ? preloadedConfig.mergeDeep(map) : map;
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

async function getConfig(file, isPreloaded) {
  const response = await fetch(file, { credentials: 'same-origin' }).catch(err => err);
  if (response instanceof Error || response.status !== 200) {
    if (isPreloaded) return parseConfig('');
    throw new Error(`Failed to load config.yml (${response.status || response})`);
  }
  const contentType = response.headers.get('Content-Type') || 'Not-Found';
  const isYaml = contentType.indexOf('yaml') !== -1;
  if (!isYaml) {
    console.log(`Response for ${file} was not yaml. (Content-Type: ${contentType})`);
    if (isPreloaded) return parseConfig('');
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

export function configDidLoad(config) {
  return dispatch => {
    dispatch(configLoaded(config));
  };
}

export function mergeConfig(config) {
  return { type: CONFIG_MERGE, payload: config };
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

export async function handleLocalBackend(mergedConfig) {
  if (mergedConfig.has('local_backend')) {
    const { proxyUrl, publish_modes, type } = await detectProxyServer(
      mergedConfig.toJS().local_backend,
    );
    if (proxyUrl) {
      mergedConfig = mergePreloadedConfig(mergedConfig, {
        backend: { name: 'proxy', proxy_url: proxyUrl },
      });
      if (
        mergedConfig.has('publish_mode') &&
        !publish_modes.includes(mergedConfig.get('publish_mode'))
      ) {
        const newPublishMode = publish_modes[0];
        console.log(
          `'${mergedConfig.get(
            'publish_mode',
          )}' is not supported by '${type}' backend, switching to '${newPublishMode}'`,
        );
        mergedConfig = mergePreloadedConfig(mergedConfig, {
          publish_mode: newPublishMode,
        });
      }
    }
  }
  return mergedConfig;
}

export function loadConfig() {
  if (window.CMS_CONFIG) {
    return configDidLoad(fromJS(window.CMS_CONFIG));
  }
  return async (dispatch, getState) => {
    dispatch(configLoading());

    try {
      const preloadedConfig = getState().config;
      const configUrl = getConfigUrl();
      const isPreloaded = preloadedConfig && preloadedConfig.size > 1;
      const loadedConfig =
        preloadedConfig && preloadedConfig.get('load_config_file') === false
          ? {}
          : await getConfig(configUrl, isPreloaded);

      /**
       * Merge any existing configuration so the result can be validated.
       */
      let mergedConfig = mergePreloadedConfig(preloadedConfig, loadedConfig);

      validateConfig(mergedConfig.toJS());

      mergedConfig = await handleLocalBackend(mergedConfig);

      const config = applyDefaults(normalizeConfig(mergedConfig));

      dispatch(configDidLoad(config));
      dispatch(authenticateUser());
    } catch (err) {
      dispatch(configFailed(err));
      throw err;
    }
  };
}
