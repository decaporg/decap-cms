"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.frontmatterFormats = exports.formatExtensions = exports.extensionFormatters = void 0;
exports.getFormatExtensions = getFormatExtensions;
exports.resolveFormat = resolveFormat;
var _get2 = _interopRequireDefault(require("lodash/get"));
var _immutable = require("immutable");
var _yaml = _interopRequireDefault(require("./yaml"));
var _toml = _interopRequireDefault(require("./toml"));
var _json = _interopRequireDefault(require("./json"));
var _frontmatter = require("./frontmatter");
var _registry = require("../lib/registry");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const frontmatterFormats = ['yaml-frontmatter', 'toml-frontmatter', 'json-frontmatter'];
exports.frontmatterFormats = frontmatterFormats;
const formatExtensions = {
  yml: 'yml',
  yaml: 'yml',
  toml: 'toml',
  json: 'json',
  frontmatter: 'md',
  'json-frontmatter': 'md',
  'toml-frontmatter': 'md',
  'yaml-frontmatter': 'md'
};
exports.formatExtensions = formatExtensions;
function getFormatExtensions() {
  return _objectSpread(_objectSpread({}, formatExtensions), (0, _registry.getCustomFormatsExtensions)());
}
const extensionFormatters = {
  yml: _yaml.default,
  yaml: _yaml.default,
  toml: _toml.default,
  json: _json.default,
  md: _frontmatter.FrontmatterInfer,
  markdown: _frontmatter.FrontmatterInfer,
  html: _frontmatter.FrontmatterInfer
};
exports.extensionFormatters = extensionFormatters;
function formatByName(name, customDelimiter) {
  const formatters = _objectSpread({
    yml: _yaml.default,
    yaml: _yaml.default,
    toml: _toml.default,
    json: _json.default,
    frontmatter: _frontmatter.FrontmatterInfer,
    'json-frontmatter': (0, _frontmatter.frontmatterJSON)(customDelimiter),
    'toml-frontmatter': (0, _frontmatter.frontmatterTOML)(customDelimiter),
    'yaml-frontmatter': (0, _frontmatter.frontmatterYAML)(customDelimiter)
  }, (0, _registry.getCustomFormatsFormatters)());
  if (name in formatters) {
    return formatters[name];
  }
  throw new Error(`No formatter available with name: ${name}`);
}
function frontmatterDelimiterIsList(frontmatterDelimiter) {
  return _immutable.List.isList(frontmatterDelimiter);
}
function resolveFormat(collection, entry) {
  // Check for custom delimiter
  const frontmatter_delimiter = collection.get('frontmatter_delimiter');
  const customDelimiter = frontmatterDelimiterIsList(frontmatter_delimiter) ? frontmatter_delimiter.toArray() : frontmatter_delimiter;

  // If the format is specified in the collection, use that format.
  const formatSpecification = collection.get('format');
  if (formatSpecification) {
    return formatByName(formatSpecification, customDelimiter);
  }

  // If a file already exists, infer the format from its file extension.
  const filePath = entry && entry.path;
  if (filePath) {
    const fileExtension = filePath.split('.').pop();
    if (fileExtension) {
      return (0, _get2.default)(extensionFormatters, fileExtension);
    }
  }

  // If creating a new file, and an `extension` is specified in the
  //   collection config, infer the format from that extension.
  const extension = collection.get('extension');
  if (extension) {
    return (0, _get2.default)(extensionFormatters, extension);
  }

  // If no format is specified and it cannot be inferred, return the default.
  return formatByName('frontmatter', customDelimiter);
}