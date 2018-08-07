import { fromJS, List, Map } from 'immutable';
import curry from 'lodash/curry';
import flow from 'lodash/flow';
import isString from 'lodash/isString';

const decodeParams = paramsString =>
  List(paramsString.split('&'))
    .map(s => List(s.split('=')).map(decodeURIComponent))
    .update(Map);

const fromURL = wholeURL => {
  const [url, allParamsString] = wholeURL.split('?');
  return Map({ url, ...(allParamsString ? { params: decodeParams(allParamsString) } : {}) });
};

const encodeParams = params =>
  params
    .entrySeq()
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

const toURL = req =>
  `${req.get('url')}${req.get('params') ? `?${encodeParams(req.get('params'))}` : ''}`;

const toFetchArguments = req => [
  toURL(req),
  req
    .delete('url')
    .delete('params')
    .toJS(),
];

const maybeRequestArg = req => {
  if (isString(req)) {
    return fromURL(req);
  }
  if (req) {
    return fromJS(req);
  }
  return Map();
};
const ensureRequestArg = func => req => func(maybeRequestArg(req));
const ensureRequestArg2 = func => (arg, req) => func(arg, maybeRequestArg(req));

// This actually performs the built request object
const performRequest = ensureRequestArg(req => fetch(...toFetchArguments(req)));

// Each of the following functions takes options and returns another
// function that performs the requested action on a request. They each
// default to containing an empty object, so you can simply call them
// without arguments to generate a request with only those properties.
const getCurriedRequestProcessor = flow([ensureRequestArg2, curry]);
const getPropSetFunctions = path => [
  getCurriedRequestProcessor((val, req) => req.setIn(path, val)),
  getCurriedRequestProcessor((val, req) => (req.getIn(path) ? req : req.setIn(path, val))),
];
const getPropMergeFunctions = path => [
  getCurriedRequestProcessor((obj, req) => req.updateIn(path, (p = Map()) => p.merge(obj))),
  getCurriedRequestProcessor((obj, req) => req.updateIn(path, (p = Map()) => Map(obj).merge(p))),
];

const [withMethod, withDefaultMethod] = getPropSetFunctions(['method']);
const [withBody, withDefaultBody] = getPropSetFunctions(['body']);
const [withParams, withDefaultParams] = getPropMergeFunctions(['params']);
const [withHeaders, withDefaultHeaders] = getPropMergeFunctions(['headers']);

// withRoot sets a root URL, unless the URL is already absolute
const absolutePath = new RegExp('^(?:[a-z]+:)?//', 'i');
const withRoot = getCurriedRequestProcessor((root, req) =>
  req.update('url', p => {
    if (absolutePath.test(p)) {
      return p;
    }
    return root && p && p[0] !== '/' && root[root.length - 1] !== '/'
      ? `${root}/${p}`
      : `${root}${p}`;
  }),
);

// withTimestamp needs no argument and has to run as late as possible,
// so it calls `withParams` only when it's actually called with a
// request.
const withTimestamp = ensureRequestArg(req => withParams({ ts: new Date().getTime() }, req));

export default {
  toURL,
  fromURL,
  performRequest,
  withMethod,
  withDefaultMethod,
  withBody,
  withDefaultBody,
  withHeaders,
  withDefaultHeaders,
  withParams,
  withDefaultParams,
  withRoot,
  withTimestamp,
};
