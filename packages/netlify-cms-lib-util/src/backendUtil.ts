import { flow, fromPairs, get } from 'lodash';
import { map } from 'lodash/fp';
import { fromJS } from 'immutable';
import { fileExtension } from './path';
import unsentRequest from './unsentRequest';
import APIError from './APIError';

type Formatter = (res: Response) => Promise<string | Blob | unknown>;

export const filterByPropExtension = (extension: string, propName: string) => <T>(arr: T[]) =>
  arr.filter(el => fileExtension(get(el, propName)) === extension);

const catchFormatErrors = (format: string, formatter: Formatter) => (res: Response) => {
  try {
    return formatter(res);
  } catch (err) {
    throw new Error(
      `Response cannot be parsed into the expected format (${format}): ${err.message}`,
    );
  }
};

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

export const parseResponse = async (
  res: Response,
  { expectingOk = true, format = 'text', apiName = '' },
) => {
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
};

export const responseParser = (options: {
  expectingOk?: boolean;
  format: string;
  apiName: string;
}) => (res: Response) => parseResponse(res, options);

export const parseLinkHeader = flow([
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
]);

export const getAllResponses = async (
  url: string,
  options: { headers?: {} } = {},
  linkHeaderRelName = 'next',
) => {
  const maxResponses = 30;
  let responseCount = 1;

  let req = unsentRequest.fromFetchArguments(url, options);

  const pageResponses = [];

  while (req && responseCount < maxResponses) {
    const pageResponse = await unsentRequest.performRequest(req);
    const linkHeader = pageResponse.headers.get('Link');
    const nextURL = linkHeader && parseLinkHeader(linkHeader)[linkHeaderRelName];

    const { headers = {} } = options;
    req = nextURL && unsentRequest.fromFetchArguments(nextURL, { headers });
    pageResponses.push(pageResponse);
    responseCount++;
  }

  return pageResponses;
};

export const getPathDepth = (path: string) => {
  const depth = path.split('/').length;
  return depth;
};
