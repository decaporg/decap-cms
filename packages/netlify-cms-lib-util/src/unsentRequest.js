import { fromJS, List, Map } from 'immutable';
import curry from 'lodash/curry';
import flow from 'lodash/flow';
import isString from 'lodash/isString';

function isAbortControllerSupported() {
  if (typeof window !== 'undefined') {
    return !!window.AbortController;
  }
  return false;
}

const timeout = 60;

function fetchWithTimeout(input, init) {
  if ((init && init.signal) || !isAbortControllerSupported()) {
    return fetch(input, init);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);
  return fetch(input, { ...init, signal: controller.signal })
    .then(res => {
      clearTimeout(timeoutId);
      return res;
    })
    .catch(e => {
      if (e.name === 'AbortError' || e.name === 'DOMException') {
        throw new Error(`Request timed out after ${timeout} seconds`);
      }
      throw e;
    });
}

function decodeParams(paramsString) {
  return List(paramsString.split('&'))
    .map(s => List(s.split('=')).map(decodeURIComponent))
    .update(Map);
}

function fromURL(wholeURL) {
  const [url, allParamsString] = wholeURL.split('?');
  return Map({ url, ...(allParamsString ? { params: decodeParams(allParamsString) } : {}) });
}

function fromFetchArguments(wholeURL, options) {
  return fromURL(wholeURL).merge(
    (options ? fromJS(options) : Map()).remove('url').remove('params'),
  );
}

function encodeParams(params) {
  return params
    .entrySeq()
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function toURL(req) {
  return `${req.get('url')}${req.get('params') ? `?${encodeParams(req.get('params'))}` : ''}`;
}

function toFetchArguments(req) {
  return [
    toURL(req),
    req
      .remove('url')
      .remove('params')
      .toJS(),
  ];
}

function maybeRequestArg(req) {
  if (isString(req)) {
    return fromURL(req);
  }
  if (req) {
    return fromJS(req);
  }
  return Map();
}

function ensureRequestArg(func) {
  return req => func(maybeRequestArg(req));
}

function ensureRequestArg2(func) {
  return (arg, req) => func(arg, maybeRequestArg(req));
}

// This actually performs the built request object
const performRequest = ensureRequestArg(req => {
  const args = toFetchArguments(req);
  return fetchWithTimeout(...args);
});

// Each of the following functions takes options and returns another
// function that performs the requested action on a request.
const getCurriedRequestProcessor = flow([ensureRequestArg2, curry]);

function getPropSetFunction(path) {
  return getCurriedRequestProcessor((val, req) => req.setIn(path, val));
}

function getPropMergeFunction(path) {
  return getCurriedRequestProcessor((obj, req) => req.updateIn(path, (p = Map()) => p.merge(obj)));
}

const withMethod = getPropSetFunction(['method']);
const withBody = getPropSetFunction(['body']);
const withNoCache = getPropSetFunction(['cache'])('no-cache');
const withParams = getPropMergeFunction(['params']);
const withHeaders = getPropMergeFunction(['headers']);

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

export default {
  toURL,
  fromURL,
  fromFetchArguments,
  performRequest,
  withMethod,
  withBody,
  withHeaders,
  withParams,
  withRoot,
  withNoCache,
  fetchWithTimeout,
};
