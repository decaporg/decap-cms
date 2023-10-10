"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FrontmatterInfer = exports.FrontmatterFormatter = void 0;
exports.frontmatterJSON = frontmatterJSON;
exports.frontmatterTOML = frontmatterTOML;
exports.frontmatterYAML = frontmatterYAML;
exports.getFormatOpts = getFormatOpts;
var _grayMatter = _interopRequireDefault(require("gray-matter"));
var _toml = _interopRequireDefault(require("./toml"));
var _yaml = _interopRequireDefault(require("./yaml"));
var _json = _interopRequireDefault(require("./json"));
const _excluded = ["body"];
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const Languages = {
  YAML: 'yaml',
  TOML: 'toml',
  JSON: 'json'
};
const parsers = {
  toml: {
    parse: input => _toml.default.fromFile(input),
    stringify: (metadata, opts) => {
      const {
        sortedKeys
      } = opts || {};
      return _toml.default.toFile(metadata, sortedKeys);
    }
  },
  json: {
    parse: input => {
      let JSONinput = input.trim();
      // Fix JSON if leading and trailing brackets were trimmed.
      if (JSONinput.slice(0, 1) !== '{') {
        JSONinput = '{' + JSONinput + '}';
      }
      return _json.default.fromFile(JSONinput);
    },
    stringify: metadata => {
      let JSONoutput = _json.default.toFile(metadata).trim();
      // Trim leading and trailing brackets.
      if (JSONoutput.slice(0, 1) === '{' && JSONoutput.slice(-1) === '}') {
        JSONoutput = JSONoutput.slice(1, -1);
      }
      return JSONoutput;
    }
  },
  yaml: {
    parse: input => _yaml.default.fromFile(input),
    stringify: (metadata, opts) => {
      const {
        sortedKeys,
        comments
      } = opts || {};
      return _yaml.default.toFile(metadata, sortedKeys, comments);
    }
  }
};
function inferFrontmatterFormat(str) {
  const lineEnd = str.indexOf('\n');
  const firstLine = str.slice(0, lineEnd !== -1 ? lineEnd : 0).trim();
  if (firstLine.length > 3 && firstLine.slice(0, 3) === '---') {
    // No need to infer, `gray-matter` will handle things like `---toml` for us.
    return;
  }
  switch (firstLine) {
    case '---':
      return getFormatOpts(Languages.YAML);
    case '+++':
      return getFormatOpts(Languages.TOML);
    case '{':
      return getFormatOpts(Languages.JSON);
    default:
      console.warn('Unrecognized front-matter format.');
  }
}
function getFormatOpts(format, customDelimiter) {
  if (!format) {
    return undefined;
  }
  const formats = {
    yaml: {
      language: Languages.YAML,
      delimiters: '---'
    },
    toml: {
      language: Languages.TOML,
      delimiters: '+++'
    },
    json: {
      language: Languages.JSON,
      delimiters: ['{', '}']
    }
  };
  const {
    language,
    delimiters
  } = formats[format];
  return {
    language,
    delimiters: customDelimiter || delimiters
  };
}
class FrontmatterFormatter {
  constructor(format, customDelimiter) {
    _defineProperty(this, "format", void 0);
    this.format = getFormatOpts(format, customDelimiter);
  }
  fromFile(content) {
    const format = this.format || inferFrontmatterFormat(content);
    const result = (0, _grayMatter.default)(content, _objectSpread({
      engines: parsers
    }, format));
    // in the absent of a body when serializing an entry we use an empty one
    // when calling `toFile`, so we don't want to add it when parsing.
    return _objectSpread(_objectSpread({}, result.data), result.content.trim() && {
      body: result.content
    });
  }
  toFile(data, sortedKeys, comments) {
    const {
        body = ''
      } = data,
      meta = _objectWithoutProperties(data, _excluded);

    // Stringify to YAML if the format was not set
    const format = this.format || getFormatOpts(Languages.YAML);

    // gray-matter always adds a line break at the end which trips our
    // change detection logic
    // https://github.com/jonschlinkert/gray-matter/issues/96
    const trimLastLineBreak = body.slice(-1) !== '\n';
    const file = _grayMatter.default.stringify(body, meta, _objectSpread({
      engines: parsers,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore `sortedKeys` is not recognized by gray-matter, so it gets passed through to the parser
      sortedKeys,
      comments
    }, format));
    return trimLastLineBreak && file.slice(-1) === '\n' ? file.slice(0, -1) : file;
  }
}
exports.FrontmatterFormatter = FrontmatterFormatter;
const FrontmatterInfer = new FrontmatterFormatter();
exports.FrontmatterInfer = FrontmatterInfer;
function frontmatterYAML(customDelimiter) {
  return new FrontmatterFormatter(Languages.YAML, customDelimiter);
}
function frontmatterTOML(customDelimiter) {
  return new FrontmatterFormatter(Languages.TOML, customDelimiter);
}
function frontmatterJSON(customDelimiter) {
  return new FrontmatterFormatter(Languages.JSON, customDelimiter);
}