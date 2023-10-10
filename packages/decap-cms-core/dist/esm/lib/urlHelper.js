"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addParams = addParams;
exports.getCharReplacer = getCharReplacer;
exports.getCollectionUrl = getCollectionUrl;
exports.getNewEntryUrl = getNewEntryUrl;
exports.joinUrlPath = joinUrlPath;
exports.sanitizeChar = sanitizeChar;
exports.sanitizeSlug = sanitizeSlug;
exports.sanitizeURI = sanitizeURI;
exports.stripProtocol = stripProtocol;
var _partialRight2 = _interopRequireDefault(require("lodash/partialRight"));
var _flow2 = _interopRequireDefault(require("lodash/flow"));
var _escapeRegExp2 = _interopRequireDefault(require("lodash/escapeRegExp"));
var _isString2 = _interopRequireDefault(require("lodash/isString"));
var _url = _interopRequireDefault(require("url"));
var _urlJoin = _interopRequireDefault(require("url-join"));
var _diacritics = _interopRequireDefault(require("diacritics"));
var _sanitizeFilename = _interopRequireDefault(require("sanitize-filename"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function getUrl(urlString, direct) {
  return `${direct ? '/#' : ''}${urlString}`;
}
function getCollectionUrl(collectionName, direct) {
  return getUrl(`/collections/${collectionName}`, direct);
}
function getNewEntryUrl(collectionName, direct) {
  return getUrl(`/collections/${collectionName}/new`, direct);
}
function addParams(urlString, params) {
  const parsedUrl = _url.default.parse(urlString, true);
  parsedUrl.query = _objectSpread(_objectSpread({}, parsedUrl.query), params);
  return _url.default.format(parsedUrl);
}
function stripProtocol(urlString) {
  const protocolEndIndex = urlString.indexOf('//');
  return protocolEndIndex > -1 ? urlString.slice(protocolEndIndex + 2) : urlString;
}

/* See https://www.w3.org/International/articles/idn-and-iri/#path.
 * According to the new IRI (Internationalized Resource Identifier) spec, RFC 3987,
 *   ASCII chars should be kept the same way as in standard URIs (letters digits _ - . ~).
 * Non-ASCII chars (unless they are not in the allowed "ucschars" list) should be percent-encoded.
 * If the string is not encoded in Unicode, it should be converted to UTF-8 and normalized first,
 *   but JS stores strings as UTF-16/UCS-2 internally, so we should not normalize or re-encode.
 */
const uriChars = /[\w\-.~]/i;
const ucsChars = /[\xA0-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}]/u;
function validURIChar(char) {
  return uriChars.test(char);
}
function validIRIChar(char) {
  return uriChars.test(char) || ucsChars.test(char);
}
function getCharReplacer(encoding, replacement) {
  let validChar;
  if (encoding === 'unicode') {
    validChar = validIRIChar;
  } else if (encoding === 'ascii') {
    validChar = validURIChar;
  } else {
    throw new Error('`options.encoding` must be "unicode" or "ascii".');
  }

  // Check and make sure the replacement character is actually a safe char itself.
  if (!Array.from(replacement).every(validChar)) {
    throw new Error('The replacement character(s) (options.replacement) is itself unsafe.');
  }
  return char => validChar(char) ? char : replacement;
}
// `sanitizeURI` does not actually URI-encode the chars (that is the browser's and server's job), just removes the ones that are not allowed.
function sanitizeURI(str, options) {
  const {
    replacement = '',
    encoding = 'unicode'
  } = options || {};
  if (!(0, _isString2.default)(str)) {
    throw new Error('The input slug must be a string.');
  }
  if (!(0, _isString2.default)(replacement)) {
    throw new Error('`options.replacement` must be a string.');
  }

  // `Array.from` must be used instead of `String.split` because
  //   `split` converts things like emojis into UTF-16 surrogate pairs.
  return Array.from(str).map(getCharReplacer(encoding, replacement)).join('');
}
function sanitizeChar(char, options) {
  const {
    encoding = 'unicode',
    sanitize_replacement: replacement = ''
  } = options || {};
  return getCharReplacer(encoding, replacement)(char);
}
function sanitizeSlug(str, options) {
  if (!(0, _isString2.default)(str)) {
    throw new Error('The input slug must be a string.');
  }
  const {
    encoding,
    clean_accents: stripDiacritics,
    sanitize_replacement: replacement
  } = options || {};
  const sanitizedSlug = (0, _flow2.default)([...(stripDiacritics ? [_diacritics.default.remove] : []), (0, _partialRight2.default)(sanitizeURI, {
    replacement,
    encoding
  }), (0, _partialRight2.default)(_sanitizeFilename.default, {
    replacement
  })])(str);

  // Remove any doubled or leading/trailing replacement characters (that were added in the sanitizers).
  const doubleReplacement = new RegExp(`(?:${(0, _escapeRegExp2.default)(replacement)})+`, 'g');
  const trailingReplacement = new RegExp(`${(0, _escapeRegExp2.default)(replacement)}$`);
  const leadingReplacement = new RegExp(`^${(0, _escapeRegExp2.default)(replacement)}`);
  const normalizedSlug = sanitizedSlug.replace(doubleReplacement, replacement).replace(leadingReplacement, '').replace(trailingReplacement, '');
  return normalizedSlug;
}
function joinUrlPath(base, ...path) {
  return (0, _urlJoin.default)(base, ...path);
}