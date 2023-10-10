"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getIntegrations = getIntegrations;
exports.selectIntegration = selectIntegration;
var _immutable = require("immutable");
var _config = require("../actions/config");
const _excluded = ["hooks", "collections", "provider"];
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function getIntegrations(config) {
  const integrations = config.integrations || [];
  const newState = integrations.reduce((acc, integration) => {
    const {
        hooks,
        collections,
        provider
      } = integration,
      providerData = _objectWithoutProperties(integration, _excluded);
    acc.providers[provider] = _objectSpread({}, providerData);
    if (!collections) {
      hooks.forEach(hook => {
        acc.hooks[hook] = provider;
      });
      return acc;
    }
    const integrationCollections = collections === '*' ? config.collections.map(collection => collection.name) : collections;
    integrationCollections.forEach(collection => {
      hooks.forEach(hook => {
        acc.hooks[collection] ? acc.hooks[collection][hook] = provider : acc.hooks[collection] = {
          [hook]: provider
        };
      });
    });
    return acc;
  }, {
    providers: {},
    hooks: {}
  });
  return (0, _immutable.fromJS)(newState);
}
const defaultState = (0, _immutable.fromJS)({
  providers: {},
  hooks: {}
});
function integrations(state = defaultState, action) {
  switch (action.type) {
    case _config.CONFIG_SUCCESS:
      {
        return getIntegrations(action.payload);
      }
    default:
      return state;
  }
}
function selectIntegration(state, collection, hook) {
  return collection ? state.getIn(['hooks', collection, hook], false) : state.getIn(['hooks', hook], false);
}
var _default = integrations;
exports.default = _default;