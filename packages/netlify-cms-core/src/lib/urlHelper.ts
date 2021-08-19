import url from 'url';
import urlJoin from 'url-join';
import diacritics from 'diacritics';
import sanitizeFilename from 'sanitize-filename';
import { isString, escapeRegExp, flow, partialRight } from 'lodash';

import type { CmsSlug } from '../types/redux';

function getUrl(urlString: string, direct?: boolean) {
  return `${direct ? '/#' : ''}${urlString}`;
}

export function getCollectionUrl(collectionName: string, direct?: boolean) {
  return getUrl(`/collections/${collectionName}`, direct);
}

export function getNewEntryUrl(collectionName: string, direct?: boolean) {
  return getUrl(`/collections/${collectionName}/new`, direct);
}

export function addParams(urlString: string, params: Record<string, string>) {
  const parsedUrl = url.parse(urlString, true);
  parsedUrl.query = { ...parsedUrl.query, ...params };
  return url.format(parsedUrl);
}

export function stripProtocol(urlString: string) {
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
const ucsChars =
  /[\xA0-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}]/u;

function validURIChar(char: string) {
  return uriChars.test(char);
}

function validIRIChar(char: string) {
  return uriChars.test(char) || ucsChars.test(char);
}

export function getCharReplacer(encoding: string, replacement: string) {
  let validChar: (char: string) => boolean;

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

  return (char: string) => (validChar(char) ? char : replacement);
}
// `sanitizeURI` does not actually URI-encode the chars (that is the browser's and server's job), just removes the ones that are not allowed.
export function sanitizeURI(
  str: string,
  options?: { replacement: CmsSlug['sanitize_replacement']; encoding: CmsSlug['encoding'] },
) {
  const { replacement = '', encoding = 'unicode' } = options || {};

  if (!isString(str)) {
    throw new Error('The input slug must be a string.');
  }
  if (!isString(replacement)) {
    throw new Error('`options.replacement` must be a string.');
  }

  // `Array.from` must be used instead of `String.split` because
  //   `split` converts things like emojis into UTF-16 surrogate pairs.
  return Array.from(str).map(getCharReplacer(encoding, replacement)).join('');
}

export function sanitizeChar(char: string, options?: CmsSlug) {
  const { encoding = 'unicode', sanitize_replacement: replacement = '' } = options || {};
  return getCharReplacer(encoding, replacement)(char);
}

export function sanitizeSlug(str: string, options?: CmsSlug) {
  if (!isString(str)) {
    throw new Error('The input slug must be a string.');
  }

  const {
    encoding,
    clean_accents: stripDiacritics,
    sanitize_replacement: replacement,
  } = options || {};

  const sanitizedSlug = flow([
    ...(stripDiacritics ? [diacritics.remove] : []),
    partialRight(sanitizeURI, { replacement, encoding }),
    partialRight(sanitizeFilename, { replacement }),
  ])(str);

  // Remove any doubled or leading/trailing replacement characters (that were added in the sanitizers).
  const doubleReplacement = new RegExp(`(?:${escapeRegExp(replacement)})+`, 'g');
  const trailingReplacement = new RegExp(`${escapeRegExp(replacement)}$`);
  const leadingReplacement = new RegExp(`^${escapeRegExp(replacement)}`);

  const normalizedSlug: string = sanitizedSlug
    .replace(doubleReplacement, replacement)
    .replace(leadingReplacement, '')
    .replace(trailingReplacement, '');

  return normalizedSlug;
}

export function joinUrlPath(base: string, ...path: string[]) {
  return urlJoin(base, ...path);
}
