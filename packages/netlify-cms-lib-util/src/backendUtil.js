import { get } from 'lodash';
import { fromJS } from 'immutable';
import { fileExtension } from './path';

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
