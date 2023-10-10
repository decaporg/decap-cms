"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterByExtension = filterByExtension;
exports.getAllResponses = getAllResponses;
exports.getPathDepth = getPathDepth;
exports.parseLinkHeader = parseLinkHeader;
exports.parseResponse = parseResponse;
exports.responseParser = responseParser;
var _map2 = _interopRequireDefault(require("lodash/fp/map"));
var _fromPairs2 = _interopRequireDefault(require("lodash/fromPairs"));
var _flow2 = _interopRequireDefault(require("lodash/flow"));
var _immutable = require("immutable");
var _unsentRequest = _interopRequireDefault(require("./unsentRequest"));
var _APIError = _interopRequireDefault(require("./APIError"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function filterByExtension(file, extension) {
  const path = (file === null || file === void 0 ? void 0 : file.path) || '';
  return path.endsWith(extension.startsWith('.') ? extension : `.${extension}`);
}
function catchFormatErrors(format, formatter) {
  return res => {
    try {
      return formatter(res);
    } catch (err) {
      throw new Error(`Response cannot be parsed into the expected format (${format}): ${err.message}`);
    }
  };
}
const responseFormatters = (0, _immutable.fromJS)({
  json: async res => {
    const contentType = res.headers.get('Content-Type') || '';
    if (!contentType.startsWith('application/json') && !contentType.startsWith('text/json')) {
      throw new Error(`${contentType} is not a valid JSON Content-Type`);
    }
    return res.json();
  },
  text: async res => res.text(),
  blob: async res => res.blob()
}).mapEntries(([format, formatter]) => [format, catchFormatErrors(format, formatter)]);
async function parseResponse(res, {
  expectingOk = true,
  format = 'text',
  apiName = ''
}) {
  let body;
  try {
    const formatter = responseFormatters.get(format, false);
    if (!formatter) {
      throw new Error(`${format} is not a supported response format.`);
    }
    body = await formatter(res);
  } catch (err) {
    throw new _APIError.default(err.message, res.status, apiName);
  }
  if (expectingOk && !res.ok) {
    var _body$error;
    const isJSON = format === 'json';
    const message = isJSON ? body.message || body.msg || ((_body$error = body.error) === null || _body$error === void 0 ? void 0 : _body$error.message) : body;
    throw new _APIError.default(isJSON && message ? message : body, res.status, apiName);
  }
  return body;
}
function responseParser(options) {
  return res => parseResponse(res, options);
}
function parseLinkHeader(header) {
  if (!header) {
    return {};
  }
  return (0, _flow2.default)([linksString => linksString.split(','), (0, _map2.default)(str => str.trim().split(';')), (0, _map2.default)(([linkStr, keyStr]) => [keyStr.match(/rel="(.*?)"/)[1], linkStr.trim().match(/<(.*?)>/)[1].replace(/\+/g, '%20')]), _fromPairs2.default])(header);
}
async function getAllResponses(url, options = {}, linkHeaderRelName, nextUrlProcessor) {
  const maxResponses = 30;
  let responseCount = 1;
  let req = _unsentRequest.default.fromFetchArguments(url, options);
  const pageResponses = [];
  while (req && responseCount < maxResponses) {
    const pageResponse = await _unsentRequest.default.performRequest(req);
    const linkHeader = pageResponse.headers.get('Link');
    const nextURL = linkHeader && parseLinkHeader(linkHeader)[linkHeaderRelName];
    const {
      headers = {}
    } = options;
    req = nextURL && _unsentRequest.default.fromFetchArguments(nextUrlProcessor(nextURL), {
      headers
    });
    pageResponses.push(pageResponse);
    responseCount++;
  }
  return pageResponses;
}
function getPathDepth(path) {
  const depth = path.split('/').length;
  return depth;
}