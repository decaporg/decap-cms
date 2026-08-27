import flow from 'lodash/flow';
import fromPairs from 'lodash/fromPairs';
import { map } from 'lodash/fp';
import { fromJS } from 'immutable';

import unsentRequest from './unsentRequest';
import APIError from './APIError';

type Formatter = (res: Response) => Promise<string | Blob | unknown>;

export function filterByExtension(file: { path: string }, extension: string) {
  const path = file?.path || '';
  return path.endsWith(extension.startsWith('.') ? extension : `.${extension}`);
}

function catchFormatErrors(format: string, formatter: Formatter) {
  return (res: Response) => {
    try {
      return formatter(res);
    } catch (err) {
      throw new Error(
        `Response cannot be parsed into the expected format (${format}): ${err.message}`,
      );
    }
  };
}

const responseFormatters = fromJS({
  json: async (res: Response) => {
    const contentType = res.headers.get('Content-Type') || '';
    if (!contentType.startsWith('application/json') && !contentType.startsWith('text/json')) {
      throw new Error(`${contentType} is not a valid JSON Content-Type`);
    }
    return res.json();
  },
  text: async (res: Response) => res.text(),
  blob: async (res: Response) => res.blob(),
}).mapEntries(([format, formatter]: [string, Formatter]) => [
  format,
  catchFormatErrors(format, formatter),
]);

export async function parseResponse(
  res: Response,
  { expectingOk = true, format = 'text', apiName = '' },
) {
  let body;
  try {
    const formatter = responseFormatters.get(format, false);
    if (!formatter) {
      throw new Error(`${format} is not a supported response format.`);
    }
    body = await formatter(res);
  } catch (err) {
    throw new APIError(err.message, res.status, apiName);
  }
  if (expectingOk && !res.ok) {
    const isJSON = format === 'json';
    const message = isJSON ? body.message || body.msg || body.error?.message : body;
    throw new APIError(isJSON && message ? message : body, res.status, apiName);
  }
  return body;
}

export function responseParser(options: {
  expectingOk?: boolean;
  format: string;
  apiName: string;
}) {
  return (res: Response) => parseResponse(res, options);
}

export function parseLinkHeader(header: string | null) {
  if (!header) {
    return {};
  }
  return flow([
    linksString => linksString.split(','),
    map((str: string) => str.trim().split(';')),
    map(([linkStr, keyStr]) => [
      keyStr.match(/rel="(.*?)"/)[1],
      linkStr
        .trim()
        .match(/<(.*?)>/)[1]
        .replace(/\+/g, '%20'),
    ]),
    fromPairs,
  ])(header);
}

export async function getAllResponses(
  url: string,
  options: { headers?: {} } = {},
  linkHeaderRelName: string,
  nextUrlProcessor: (url: string) => string,
) {
  const maxResponses = 30;
  let responseCount = 1;

  let req = unsentRequest.fromFetchArguments(url, options);

  const pageResponses = [];

  while (req && responseCount < maxResponses) {
    const pageResponse = await unsentRequest.performRequest(req);
    const linkHeader = pageResponse.headers.get('Link');
    const nextURL = linkHeader && parseLinkHeader(linkHeader)[linkHeaderRelName];

    const { headers = {} } = options;
    req = nextURL && unsentRequest.fromFetchArguments(nextUrlProcessor(nextURL), { headers });
    pageResponses.push(pageResponse);
    responseCount++;
  }

  return pageResponses;
}

export function getPathDepth(path: string) {
  const depth = path.split('/').length;
  return depth;
}

/**
 * Stable cache key for a files collection.
 *
 * decap-cms-core's `entriesByFiles` receives only the file list, never the
 * collection name, so a backend that caches such a collection has to derive an
 * identity from the paths themselves.
 *
 * Sorted before hashing so key identity does not depend on the order files
 * happen to be listed in config.yml — reordering them must not orphan the
 * cached rows. Hashed so a collection of many paths does not become a
 * multi-kilobyte value repeated on every cached row.
 *
 * FNV-1a rather than a crypto digest: this needs to be deterministic, short and
 * synchronous, not unforgeable. It lives here rather than in one backend
 * because both Turbo backends need exactly the same key.
 */
export function collectionKeyForFiles(paths: string[]) {
  let hash = 0x811c9dc5;
  for (const char of [...paths].sort().join('\n')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `files:${paths.length}:${hash.toString(36)}`;
}
