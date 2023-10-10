"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getBackend = getBackend;
exports.getCustomFormats = getCustomFormats;
exports.getCustomFormatsExtensions = getCustomFormatsExtensions;
exports.getCustomFormatsFormatters = getCustomFormatsFormatters;
exports.getEditorComponents = getEditorComponents;
exports.getEventListeners = getEventListeners;
exports.getFormatter = getFormatter;
exports.getLocale = getLocale;
exports.getMediaLibrary = getMediaLibrary;
exports.getPreviewStyles = getPreviewStyles;
exports.getPreviewTemplate = getPreviewTemplate;
exports.getRemarkPlugins = getRemarkPlugins;
exports.getWidget = getWidget;
exports.getWidgetValueSerializer = getWidgetValueSerializer;
exports.getWidgets = getWidgets;
exports.invokeEvent = invokeEvent;
exports.registerBackend = registerBackend;
exports.registerCustomFormat = registerCustomFormat;
exports.registerEditorComponent = registerEditorComponent;
exports.registerEventListener = registerEventListener;
exports.registerLocale = registerLocale;
exports.registerMediaLibrary = registerMediaLibrary;
exports.registerPreviewStyle = registerPreviewStyle;
exports.registerPreviewTemplate = registerPreviewTemplate;
exports.registerRemarkPlugin = registerRemarkPlugin;
exports.registerWidget = registerWidget;
exports.registerWidgetValueSerializer = registerWidgetValueSerializer;
exports.removeEventListener = removeEventListener;
exports.resolveWidget = resolveWidget;
var _immutable = require("immutable");
var _immer = _interopRequireDefault(require("immer"));
var _commonTags = require("common-tags");
var _EditorComponent = _interopRequireDefault(require("../valueObjects/EditorComponent"));
const _excluded = ["name", "controlComponent", "previewComponent", "schema", "allowMapValue", "globalStyles"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const allowedEvents = ['prePublish', 'postPublish', 'preUnpublish', 'postUnpublish', 'preSave', 'postSave'];
const eventHandlers = {};
allowedEvents.forEach(e => {
  eventHandlers[e] = [];
});

/**
 * Global Registry Object
 */
const registry = {
  backends: {},
  templates: {},
  previewStyles: [],
  widgets: {},
  editorComponents: (0, _immutable.Map)(),
  remarkPlugins: [],
  widgetValueSerializers: {},
  mediaLibraries: [],
  locales: {},
  eventHandlers,
  formats: {}
};
var _default = {
  registerPreviewStyle,
  getPreviewStyles,
  registerPreviewTemplate,
  getPreviewTemplate,
  registerWidget,
  getWidget,
  getWidgets,
  resolveWidget,
  registerEditorComponent,
  getEditorComponents,
  registerRemarkPlugin,
  getRemarkPlugins,
  registerWidgetValueSerializer,
  getWidgetValueSerializer,
  registerBackend,
  getBackend,
  registerMediaLibrary,
  getMediaLibrary,
  registerLocale,
  getLocale,
  registerEventListener,
  removeEventListener,
  getEventListeners,
  invokeEvent,
  registerCustomFormat,
  getCustomFormats,
  getCustomFormatsExtensions,
  getCustomFormatsFormatters
};
/**
 * Preview Styles
 *
 * Valid options:
 *  - raw {boolean} if `true`, `style` value is expected to be a CSS string
 */
exports.default = _default;
function registerPreviewStyle(style, opts) {
  registry.previewStyles.push(_objectSpread(_objectSpread({}, opts), {}, {
    value: style
  }));
}
function getPreviewStyles() {
  return registry.previewStyles;
}

/**
 * Preview Templates
 */
function registerPreviewTemplate(name, component) {
  registry.templates[name] = component;
}
function getPreviewTemplate(name) {
  return registry.templates[name];
}

/**
 * Editor Widgets
 */
function registerWidget(name, control, preview, schema = {}) {
  if (Array.isArray(name)) {
    name.forEach(widget => {
      if (typeof widget !== 'object') {
        console.error(`Cannot register widget: ${widget}`);
      } else {
        registerWidget(widget);
      }
    });
  } else if (typeof name === 'string') {
    // A registered widget control can be reused by a new widget, allowing
    // multiple copies with different previews.
    const newControl = typeof control === 'string' ? registry.widgets[control].control : control;
    registry.widgets[name] = {
      control: newControl,
      preview,
      schema
    };
  } else if (typeof name === 'object') {
    const {
        name: widgetName,
        controlComponent: control,
        previewComponent: preview,
        schema = {},
        allowMapValue,
        globalStyles
      } = name,
      options = _objectWithoutProperties(name, _excluded);
    if (registry.widgets[widgetName]) {
      console.warn((0, _commonTags.oneLine)`
        Multiple widgets registered with name "${widgetName}". Only the last widget registered with
        this name will be used.
      `);
    }
    if (!control) {
      throw Error(`Widget "${widgetName}" registered without \`controlComponent\`.`);
    }
    registry.widgets[widgetName] = _objectSpread({
      control,
      preview,
      schema,
      globalStyles,
      allowMapValue
    }, options);
  } else {
    console.error('`registerWidget` failed, called with incorrect arguments.');
  }
}
function getWidget(name) {
  return registry.widgets[name];
}
function getWidgets() {
  return (0, _immer.default)(Object.entries(registry.widgets), draft => {
    return draft.map(([key, value]) => _objectSpread({
      name: key
    }, value));
  });
}
function resolveWidget(name) {
  return getWidget(name || 'string') || getWidget('unknown');
}

/**
 * Markdown Editor Custom Components
 */
function registerEditorComponent(component) {
  const plugin = (0, _EditorComponent.default)(component);
  if (plugin.type === 'code-block') {
    const codeBlock = registry.editorComponents.find(c => c.type === 'code-block');
    if (codeBlock) {
      console.warn((0, _commonTags.oneLine)`
        Only one editor component of type "code-block" may be registered. Previously registered code
        block component(s) will be overwritten.
      `);
      registry.editorComponents = registry.editorComponents.delete(codeBlock.id);
    }
  }
  registry.editorComponents = registry.editorComponents.set(plugin.id, plugin);
}
function getEditorComponents() {
  return registry.editorComponents;
}

/**
 * Remark plugins
 */
/** @typedef {import('unified').Pluggable} RemarkPlugin */
/** @type {(plugin: RemarkPlugin) => void} */
function registerRemarkPlugin(plugin) {
  registry.remarkPlugins.push(plugin);
}
/** @type {() => Array<RemarkPlugin>} */
function getRemarkPlugins() {
  return registry.remarkPlugins;
}

/**
 * Widget Serializers
 */
function registerWidgetValueSerializer(widgetName, serializer) {
  registry.widgetValueSerializers[widgetName] = serializer;
}
function getWidgetValueSerializer(widgetName) {
  return registry.widgetValueSerializers[widgetName];
}

/**
 * Backend API
 */
function registerBackend(name, BackendClass) {
  if (!name || !BackendClass) {
    console.error("Backend parameters invalid. example: CMS.registerBackend('myBackend', BackendClass)");
  } else if (registry.backends[name]) {
    console.error(`Backend [${name}] already registered. Please choose a different name.`);
  } else {
    registry.backends[name] = {
      init: (...args) => new BackendClass(...args)
    };
  }
}
function getBackend(name) {
  return registry.backends[name];
}

/**
 * Media Libraries
 */
function registerMediaLibrary(mediaLibrary, options) {
  if (registry.mediaLibraries.find(ml => mediaLibrary.name === ml.name)) {
    throw new Error(`A media library named ${mediaLibrary.name} has already been registered.`);
  }
  registry.mediaLibraries.push(_objectSpread(_objectSpread({}, mediaLibrary), {}, {
    options
  }));
}
function getMediaLibrary(name) {
  return registry.mediaLibraries.find(ml => ml.name === name);
}
function validateEventName(name) {
  if (!allowedEvents.includes(name)) {
    throw new Error(`Invalid event name '${name}'`);
  }
}
function getEventListeners(name) {
  validateEventName(name);
  return [...registry.eventHandlers[name]];
}
function registerEventListener({
  name,
  handler
}, options = {}) {
  validateEventName(name);
  registry.eventHandlers[name].push({
    handler,
    options
  });
}
async function invokeEvent({
  name,
  data
}) {
  validateEventName(name);
  const handlers = registry.eventHandlers[name];
  let _data = _objectSpread({}, data);
  for (const {
    handler,
    options
  } of handlers) {
    const result = await handler(_data, options);
    if (result !== undefined) {
      const entry = _data.entry.set('data', result);
      _data = _objectSpread(_objectSpread({}, data), {}, {
        entry
      });
    }
  }
  return _data.entry.get('data');
}
function removeEventListener({
  name,
  handler
}) {
  validateEventName(name);
  if (handler) {
    registry.eventHandlers[name] = registry.eventHandlers[name].filter(item => item.handler !== handler);
  } else {
    registry.eventHandlers[name] = [];
  }
}

/**
 * Locales
 */
function registerLocale(locale, phrases) {
  if (!locale || !phrases) {
    console.error("Locale parameters invalid. example: CMS.registerLocale('locale', phrases)");
  } else {
    registry.locales[locale] = phrases;
  }
}
function getLocale(locale) {
  return registry.locales[locale];
}
function registerCustomFormat(name, extension, formatter) {
  registry.formats[name] = {
    extension,
    formatter
  };
}
function getCustomFormats() {
  return registry.formats;
}
function getCustomFormatsExtensions() {
  return Object.entries(registry.formats).reduce(function (acc, [name, {
    extension
  }]) {
    return _objectSpread(_objectSpread({}, acc), {}, {
      [name]: extension
    });
  }, {});
}

/** @type {() => Record<string, unknown>} */
function getCustomFormatsFormatters() {
  return Object.entries(registry.formats).reduce(function (acc, [name, {
    formatter
  }]) {
    return _objectSpread(_objectSpread({}, acc), {}, {
      [name]: formatter
    });
  }, {});
}
function getFormatter(name) {
  var _registry$formats$nam;
  return (_registry$formats$nam = registry.formats[name]) === null || _registry$formats$nam === void 0 ? void 0 : _registry$formats$nam.formatter;
}