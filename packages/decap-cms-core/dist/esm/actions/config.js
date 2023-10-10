"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CONFIG_SUCCESS = exports.CONFIG_REQUEST = exports.CONFIG_FAILURE = void 0;
exports.applyDefaults = applyDefaults;
exports.configFailed = configFailed;
exports.configLoaded = configLoaded;
exports.configLoading = configLoading;
exports.detectProxyServer = detectProxyServer;
exports.handleLocalBackend = handleLocalBackend;
exports.loadConfig = loadConfig;
exports.normalizeConfig = normalizeConfig;
exports.parseConfig = parseConfig;
var _isEmpty2 = _interopRequireDefault(require("lodash/isEmpty"));
var _trim2 = _interopRequireDefault(require("lodash/trim"));
var _trimStart2 = _interopRequireDefault(require("lodash/trimStart"));
var _yaml = _interopRequireDefault(require("yaml"));
var _immutable = require("immutable");
var _deepmerge = _interopRequireDefault(require("deepmerge"));
var _immer = require("immer");
var _publishModes = require("../constants/publishModes");
var _configSchema = require("../constants/configSchema");
var _collections = require("../reducers/collections");
var _integrations = require("../reducers/integrations");
var _backend = require("../backend");
var _i18n = require("../lib/i18n");
var _collectionTypes = require("../constants/collectionTypes");
const _excluded = ["sortableFields"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const CONFIG_REQUEST = 'CONFIG_REQUEST';
exports.CONFIG_REQUEST = CONFIG_REQUEST;
const CONFIG_SUCCESS = 'CONFIG_SUCCESS';
exports.CONFIG_SUCCESS = CONFIG_SUCCESS;
const CONFIG_FAILURE = 'CONFIG_FAILURE';
exports.CONFIG_FAILURE = CONFIG_FAILURE;
function isObjectField(field) {
  return 'fields' in field;
}
function isFieldList(field) {
  return 'types' in field || 'field' in field;
}
function traverseFieldsJS(fields, updater) {
  return fields.map(field => {
    const newField = updater(field);
    if (isObjectField(newField)) {
      return _objectSpread(_objectSpread({}, newField), {}, {
        fields: traverseFieldsJS(newField.fields, updater)
      });
    } else if (isFieldList(newField) && newField.field) {
      return _objectSpread(_objectSpread({}, newField), {}, {
        field: traverseFieldsJS([newField.field], updater)[0]
      });
    } else if (isFieldList(newField) && newField.types) {
      return _objectSpread(_objectSpread({}, newField), {}, {
        types: traverseFieldsJS(newField.types, updater)
      });
    }
    return newField;
  });
}
function getConfigUrl() {
  const validTypes = {
    'text/yaml': 'yaml',
    'application/x-yaml': 'yaml'
  };
  const configLinkEl = document.querySelector('link[rel="cms-config-url"]');
  if (configLinkEl && validTypes[configLinkEl.type] && configLinkEl.href) {
    console.log(`Using config file path: "${configLinkEl.href}"`);
    return configLinkEl.href;
  }
  return 'config.yml';
}
function setDefaultPublicFolderForField(field) {
  if ('media_folder' in field && !('public_folder' in field)) {
    return _objectSpread(_objectSpread({}, field), {}, {
      public_folder: field.media_folder
    });
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
  optionsLength: 'options_length'
};
function setSnakeCaseConfig(field) {
  const deprecatedKeys = Object.keys(WIDGET_KEY_MAP).filter(camel => camel in field);
  const snakeValues = deprecatedKeys.map(camel => {
    const snake = WIDGET_KEY_MAP[camel];
    console.warn(`Field ${field.name} is using a deprecated configuration '${camel}'. Please use '${snake}'`);
    return {
      [snake]: field[camel]
    };
  });
  return Object.assign({}, field, ...snakeValues);
}
function setI18nField(field) {
  if (field[_i18n.I18N] === true) {
    return _objectSpread(_objectSpread({}, field), {}, {
      [_i18n.I18N]: _i18n.I18N_FIELD.TRANSLATE
    });
  } else if (field[_i18n.I18N] === false || !field[_i18n.I18N]) {
    return _objectSpread(_objectSpread({}, field), {}, {
      [_i18n.I18N]: _i18n.I18N_FIELD.NONE
    });
  }
  return field;
}
function getI18nDefaults(collectionOrFileI18n, defaultI18n) {
  if (typeof collectionOrFileI18n === 'boolean') {
    return defaultI18n;
  } else {
    const locales = collectionOrFileI18n.locales || defaultI18n.locales;
    const defaultLocale = collectionOrFileI18n.default_locale || locales[0];
    const mergedI18n = (0, _deepmerge.default)(defaultI18n, collectionOrFileI18n);
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
      const newField = _objectSpread({}, field);
      delete newField[_i18n.I18N];
      return newField;
    });
  }
}
function throwOnInvalidFileCollectionStructure(i18n) {
  if (i18n && i18n.structure !== _i18n.I18N_STRUCTURE.SINGLE_FILE) {
    throw new Error(`i18n configuration for files collections is limited to ${_i18n.I18N_STRUCTURE.SINGLE_FILE} structure`);
  }
}
function throwOnMissingDefaultLocale(i18n) {
  if (i18n && i18n.default_locale && !i18n.locales.includes(i18n.default_locale)) {
    throw new Error(`i18n locales '${i18n.locales.join(', ')}' are missing the default locale ${i18n.default_locale}`);
  }
}
function hasIntegration(config, collection) {
  // TODO remove fromJS when Immutable is removed from the integrations state slice
  const integrations = (0, _integrations.getIntegrations)((0, _immutable.fromJS)(config));
  const integration = (0, _integrations.selectIntegration)(integrations, collection.name, 'listEntries');
  return !!integration;
}
function normalizeConfig(config) {
  const {
    collections = []
  } = config;
  const normalizedCollections = collections.map(collection => {
    const {
      fields,
      files
    } = collection;
    let normalizedCollection = collection;
    if (fields) {
      const normalizedFields = traverseFieldsJS(fields, setSnakeCaseConfig);
      normalizedCollection = _objectSpread(_objectSpread({}, normalizedCollection), {}, {
        fields: normalizedFields
      });
    }
    if (files) {
      const normalizedFiles = files.map(file => {
        const normalizedFileFields = traverseFieldsJS(file.fields, setSnakeCaseConfig);
        return _objectSpread(_objectSpread({}, file), {}, {
          fields: normalizedFileFields
        });
      });
      normalizedCollection = _objectSpread(_objectSpread({}, normalizedCollection), {}, {
        files: normalizedFiles
      });
    }
    if (normalizedCollection.sortableFields) {
      const {
          sortableFields
        } = normalizedCollection,
        rest = _objectWithoutProperties(normalizedCollection, _excluded);
      normalizedCollection = _objectSpread(_objectSpread({}, rest), {}, {
        sortable_fields: sortableFields
      });
      console.warn(`Collection ${collection.name} is using a deprecated configuration 'sortableFields'. Please use 'sortable_fields'`);
    }
    return normalizedCollection;
  });
  return _objectSpread(_objectSpread({}, config), {}, {
    collections: normalizedCollections
  });
}
function applyDefaults(originalConfig) {
  return (0, _immer.produce)(originalConfig, config => {
    config.publish_mode = config.publish_mode || _publishModes.SIMPLE;
    config.slug = config.slug || {};
    config.collections = config.collections || [];

    // Use `site_url` as default `display_url`.
    if (!config.display_url && config.site_url) {
      config.display_url = config.site_url;
    }

    // Use media_folder as default public_folder.
    const defaultPublicFolder = `/${(0, _trimStart2.default)(config.media_folder, '/')}`;
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
    const i18n = config[_i18n.I18N];
    if (i18n) {
      i18n.default_locale = i18n.default_locale || i18n.locales[0];
    }
    throwOnMissingDefaultLocale(i18n);
    const backend = (0, _backend.resolveBackend)(config);
    for (const collection of config.collections) {
      if (!('publish' in collection)) {
        collection.publish = true;
      }
      let collectionI18n = collection[_i18n.I18N];
      if (i18n && collectionI18n) {
        collectionI18n = getI18nDefaults(collectionI18n, i18n);
        collection[_i18n.I18N] = collectionI18n;
      } else {
        collectionI18n = undefined;
        delete collection[_i18n.I18N];
      }
      if (collection.fields) {
        collection.fields = setI18nDefaultsForFields(collection.fields, Boolean(collectionI18n));
      }
      const {
        folder,
        files,
        view_filters,
        view_groups,
        meta
      } = collection;
      if (folder) {
        collection.type = _collectionTypes.FOLDER;
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
        collection.folder = (0, _trim2.default)(folder, '/');
        if (meta && meta.path) {
          const metaField = _objectSpread({
            name: 'path',
            meta: true,
            required: true
          }, meta.path);
          collection.fields = [metaField, ...(collection.fields || [])];
        }
      }
      if (files) {
        collection.type = _collectionTypes.FILES;
        throwOnInvalidFileCollectionStructure(collectionI18n);
        delete collection.nested;
        delete collection.meta;
        for (const file of files) {
          file.file = (0, _trimStart2.default)(file.file, '/');
          if ('media_folder' in file && !('public_folder' in file)) {
            file.public_folder = file.media_folder;
          }
          if (file.fields) {
            file.fields = traverseFieldsJS(file.fields, setDefaultPublicFolderForField);
          }
          let fileI18n = file[_i18n.I18N];
          if (fileI18n && collectionI18n) {
            fileI18n = getI18nDefaults(fileI18n, collectionI18n);
            file[_i18n.I18N] = fileI18n;
          } else {
            fileI18n = undefined;
            delete file[_i18n.I18N];
          }
          throwOnInvalidFileCollectionStructure(fileI18n);
          if (file.fields) {
            file.fields = setI18nDefaultsForFields(file.fields, Boolean(fileI18n));
          }
        }
      }
      if (!collection.sortable_fields) {
        collection.sortable_fields = (0, _collections.selectDefaultSortableFields)(
        // TODO remove fromJS when Immutable is removed from the collections state slice
        (0, _immutable.fromJS)(collection), backend, hasIntegration(config, collection));
      }
      collection.view_filters = (view_filters || []).map(filter => {
        return _objectSpread(_objectSpread({}, filter), {}, {
          id: `${filter.field}__${filter.pattern}`
        });
      });
      collection.view_groups = (view_groups || []).map(group => {
        return _objectSpread(_objectSpread({}, group), {}, {
          id: `${group.field}__${group.pattern}`
        });
      });
      if (config.editor && !collection.editor) {
        collection.editor = {
          preview: config.editor.preview
        };
      }
    }
  });
}
function parseConfig(data) {
  const config = _yaml.default.parse(data, {
    maxAliasCount: -1,
    prettyErrors: true,
    merge: true
  });
  if (typeof window !== 'undefined' && typeof window.CMS_ENV === 'string' && config[window.CMS_ENV]) {
    const configKeys = Object.keys(config[window.CMS_ENV]);
    for (const key of configKeys) {
      config[key] = config[window.CMS_ENV][key];
    }
  }
  return config;
}
async function getConfigYaml(file, hasManualConfig) {
  const response = await fetch(file, {
    credentials: 'same-origin'
  }).catch(error => error);
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
function configLoaded(config) {
  return {
    type: CONFIG_SUCCESS,
    payload: config
  };
}
function configLoading() {
  return {
    type: CONFIG_REQUEST
  };
}
function configFailed(err) {
  return {
    type: CONFIG_FAILURE,
    error: 'Error loading config',
    payload: err
  };
}
async function detectProxyServer(localBackend) {
  const allowedHosts = ['localhost', '127.0.0.1', ...(typeof localBackend === 'boolean' ? [] : (localBackend === null || localBackend === void 0 ? void 0 : localBackend.allowed_hosts) || [])];
  if (!allowedHosts.includes(location.hostname) || !localBackend) {
    return {};
  }
  const defaultUrl = 'http://localhost:8081/api/v1';
  const proxyUrl = localBackend === true ? defaultUrl : localBackend.url || defaultUrl.replace('localhost', location.hostname);
  try {
    console.log(`Looking for Decap CMS Proxy Server at '${proxyUrl}'`);
    const res = await fetch(`${proxyUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'info'
      })
    });
    const {
      repo,
      publish_modes,
      type
    } = await res.json();
    if (typeof repo === 'string' && Array.isArray(publish_modes) && typeof type === 'string') {
      console.log(`Detected Decap CMS Proxy Server at '${proxyUrl}' with repo: '${repo}'`);
      return {
        proxyUrl,
        publish_modes,
        type
      };
    } else {
      console.log(`Decap CMS Proxy Server not detected at '${proxyUrl}'`);
      return {};
    }
  } catch {
    console.log(`Decap CMS Proxy Server not detected at '${proxyUrl}'`);
    return {};
  }
}
function getPublishMode(config, publishModes, backendType) {
  if (config.publish_mode && publishModes && !publishModes.includes(config.publish_mode)) {
    const newPublishMode = publishModes[0];
    console.log(`'${config.publish_mode}' is not supported by '${backendType}' backend, switching to '${newPublishMode}'`);
    return newPublishMode;
  }
  return config.publish_mode;
}
async function handleLocalBackend(originalConfig) {
  if (!originalConfig.local_backend) {
    return originalConfig;
  }
  const {
    proxyUrl,
    publish_modes: publishModes,
    type: backendType
  } = await detectProxyServer(originalConfig.local_backend);
  if (!proxyUrl) {
    return originalConfig;
  }
  return (0, _immer.produce)(originalConfig, config => {
    config.backend.name = 'proxy';
    config.backend.proxy_url = proxyUrl;
    if (config.publish_mode) {
      config.publish_mode = getPublishMode(config, publishModes, backendType);
    }
  });
}
function loadConfig(manualConfig = {}, onLoad) {
  if (window.CMS_CONFIG) {
    return configLoaded(window.CMS_CONFIG);
  }
  return async dispatch => {
    dispatch(configLoading());
    try {
      const configUrl = getConfigUrl();
      const hasManualConfig = !(0, _isEmpty2.default)(manualConfig);
      const configYaml = manualConfig.load_config_file === false ? {} : await getConfigYaml(configUrl, hasManualConfig);

      // Merge manual config into the config.yml one
      const mergedConfig = (0, _deepmerge.default)(configYaml, manualConfig);
      (0, _configSchema.validateConfig)(mergedConfig);
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