import { flow, fromPairs, get } from 'lodash';
import { map } from 'lodash/fp';
import { fromJS } from 'immutable';
import { fileExtension } from './path';
import unsentRequest from './unsentRequest';

export const filterByPropExtension = (extension, propName) => arr =>
  arr.filter(el => fileExtension(get(el, propName)) === extension);

const catchFormatErrors = (format, formatter) => res => {
  try {
    return formatter(res);
  } catch (err) {
    throw new Error(
      `Response cannot be parsed into the expected format (${format}): ${err.message}`,
    );
  }
};

const responseFormatters = fromJS({
  json: async res => {
    const contentType = res.headers.get('Content-Type');
    if (!contentType.startsWith('application/json') && !contentType.startsWith('text/json')) {
      throw new Error(`${contentType} is not a valid JSON Content-Type`);
    }
    return res.json();
  },
  text: async res => res.text(),
  blob: async res => res.blob(),
}).mapEntries(([format, formatter]) => [format, catchFormatErrors(format, formatter)]);

export const parseResponse = async (res, { expectingOk = true, format = 'text' } = {}) => {
  if (expectingOk && !res.ok) {
    throw new Error(`Expected an ok response, but received an error status: ${res.status}.`);
  }
  const formatter = responseFormatters.get(format, false);
  if (!formatter) {
    throw new Error(`${format} is not a supported response format.`);
  }
  const body = await formatter(res);
  return body;
};

export const responseParser = options => res => parseResponse(res, options);

export const parseLinkHeader = flow([
  linksString => linksString.split(','),
  map(str => str.trim().split(';')),
  map(([linkStr, keyStr]) => [
    keyStr.match(/rel="(.*?)"/)[1],
    linkStr
      .trim()
      .match(/<(.*?)>/)[1]
      .replace(/\+/g, '%20'),
  ]),
  fromPairs,
]);

export const getAllResponses = async (url, options = {}, linkHeaderRelName = 'next') => {
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
