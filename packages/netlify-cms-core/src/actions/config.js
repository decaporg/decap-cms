import yaml from 'yaml';
import { Map, fromJS } from 'immutable';
import { trimStart, trim, get, isPlainObject } from 'lodash';
import { authenticateUser } from 'Actions/auth';
import * as publishModes from 'Constants/publishModes';
import { validateConfig } from 'Constants/configSchema';
import { selectDefaultSortableFields, traverseFields } from '../reducers/collections';
import { resolveBackend } from 'coreSrc/backend';

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

const defaults = {
  publish_mode: publishModes.SIMPLE,
};

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
          }

          const files = collection.get('files');
          if (files) {
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

          if (!collection.has('sortableFields')) {
            const backend = resolveBackend(config);
            const defaultSortable = selectDefaultSortableFields(collection, backend);
            collection = collection.set('sortableFields', fromJS(defaultSortable));
          }

          if (!collection.has('view_filters')) {
            collection = collection.set('view_filters', fromJS([]));
          } else {
            collection = collection.set(
              'view_filters',
              collection
                .get('view_filters')
                .map(v => v.set('id', `${v.get('field')}__${v.get('pattern')}`)),
            );
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

      const config = applyDefaults(mergedConfig);

      dispatch(configDidLoad(config));
      dispatch(authenticateUser());
    } catch (err) {
      dispatch(configFailed(err));
      throw err;
    }
  };
}
