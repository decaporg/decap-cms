"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _decapCmsUiDefault = require("decap-cms-ui-default");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const languageSelectStyles = _objectSpread(_objectSpread({}, _decapCmsUiDefault.reactSelectStyles), {}, {
  container: provided => _objectSpread(_objectSpread({}, _decapCmsUiDefault.reactSelectStyles.container(provided)), {}, {
    'margin-top': '2px'
  }),
  control: provided => _objectSpread(_objectSpread({}, _decapCmsUiDefault.reactSelectStyles.control(provided)), {}, {
    border: _decapCmsUiDefault.borders.textField,
    padding: 0,
    fontSize: '13px',
    minHeight: 'auto'
  }),
  dropdownIndicator: provided => _objectSpread(_objectSpread({}, _decapCmsUiDefault.reactSelectStyles.dropdownIndicator(provided)), {}, {
    padding: '4px'
  }),
  option: (provided, state) => _objectSpread(_objectSpread({}, _decapCmsUiDefault.reactSelectStyles.option(provided, state)), {}, {
    padding: 0,
    paddingLeft: '8px'
  }),
  menu: provided => _objectSpread(_objectSpread({}, _decapCmsUiDefault.reactSelectStyles.menu(provided)), {}, {
    margin: '2px 0'
  }),
  menuList: provided => _objectSpread(_objectSpread({}, provided), {}, {
    'max-height': '200px'
  })
});
var _default = languageSelectStyles;
exports.default = _default;