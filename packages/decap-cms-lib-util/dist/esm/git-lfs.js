"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPointerFile = createPointerFile;
exports.getLargeMediaFilteredMediaFiles = getLargeMediaFilteredMediaFiles;
exports.getLargeMediaPatternsFromGitAttributesFile = void 0;
exports.getPointerFileForMediaFileObj = getPointerFileForMediaFileObj;
exports.parsePointerFile = void 0;
var _map2 = _interopRequireDefault(require("lodash/fp/map"));
var _fromPairs2 = _interopRequireDefault(require("lodash/fp/fromPairs"));
var _flow2 = _interopRequireDefault(require("lodash/fp/flow"));
var _filter2 = _interopRequireDefault(require("lodash/fp/filter"));
var _getBlobSHA = _interopRequireDefault(require("./getBlobSHA"));
const _excluded = ["size", "oid"]; //
// Pointer file parsing
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function splitIntoLines(str) {
  return str.split('\n');
}
function splitIntoWords(str) {
  return str.split(/\s+/g);
}
function isNonEmptyString(str) {
  return str !== '';
}
const withoutEmptyLines = (0, _flow2.default)([(0, _map2.default)(str => str.trim()), (0, _filter2.default)(isNonEmptyString)]);
const parsePointerFile = (0, _flow2.default)([splitIntoLines, withoutEmptyLines, (0, _map2.default)(splitIntoWords), _fromPairs2.default, _ref => {
  let {
      size,
      oid
    } = _ref,
    rest = _objectWithoutProperties(_ref, _excluded);
  return _objectSpread({
    size: parseInt(size),
    sha: oid === null || oid === void 0 ? void 0 : oid.split(':')[1]
  }, rest);
}]);

//
// .gitattributes file parsing
exports.parsePointerFile = parsePointerFile;
function removeGitAttributesCommentsFromLine(line) {
  return line.split('#')[0];
}
function parseGitPatternAttribute(attributeString) {
  // There are three kinds of attribute settings:
  // - a key=val pair sets an attribute to a specific value
  // - a key without a value and a leading hyphen sets an attribute to false
  // - a key without a value and no leading hyphen sets an attribute
  //   to true
  if (attributeString.includes('=')) {
    return attributeString.split('=');
  }
  if (attributeString.startsWith('-')) {
    return [attributeString.slice(1), false];
  }
  return [attributeString, true];
}
const parseGitPatternAttributes = (0, _flow2.default)([(0, _map2.default)(parseGitPatternAttribute), _fromPairs2.default]);
const parseGitAttributesPatternLine = (0, _flow2.default)([splitIntoWords, ([pattern, ...attributes]) => [pattern, parseGitPatternAttributes(attributes)]]);
const parseGitAttributesFileToPatternAttributePairs = (0, _flow2.default)([splitIntoLines, (0, _map2.default)(removeGitAttributesCommentsFromLine), withoutEmptyLines, (0, _map2.default)(parseGitAttributesPatternLine)]);
const getLargeMediaPatternsFromGitAttributesFile = (0, _flow2.default)([parseGitAttributesFileToPatternAttributePairs, (0, _filter2.default)(([, attributes]) => attributes.filter === 'lfs' && attributes.diff === 'lfs' && attributes.merge === 'lfs'), (0, _map2.default)(([pattern]) => pattern)]);
exports.getLargeMediaPatternsFromGitAttributesFile = getLargeMediaPatternsFromGitAttributesFile;
function createPointerFile({
  size,
  sha
}) {
  return `\
version https://git-lfs.github.com/spec/v1
oid sha256:${sha}
size ${size}
`;
}
async function getPointerFileForMediaFileObj(client, fileObj, path) {
  const {
    name,
    size
  } = fileObj;
  const sha = await (0, _getBlobSHA.default)(fileObj);
  await client.uploadResource({
    sha,
    size
  }, fileObj);
  const pointerFileString = createPointerFile({
    sha,
    size
  });
  const pointerFileBlob = new Blob([pointerFileString]);
  const pointerFile = new File([pointerFileBlob], name, {
    type: 'text/plain'
  });
  const pointerFileSHA = await (0, _getBlobSHA.default)(pointerFile);
  return {
    fileObj: pointerFile,
    size: pointerFileBlob.size,
    sha: pointerFileSHA,
    raw: pointerFileString,
    path
  };
}
async function getLargeMediaFilteredMediaFiles(client, mediaFiles) {
  return await Promise.all(mediaFiles.map(async mediaFile => {
    const {
      fileObj,
      path
    } = mediaFile;
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    if (!client.matchPath(fixedPath)) {
      return mediaFile;
    }
    const pointerFileDetails = await getPointerFileForMediaFileObj(client, fileObj, path);
    return _objectSpread(_objectSpread({}, mediaFile), pointerFileDetails);
  }));
}