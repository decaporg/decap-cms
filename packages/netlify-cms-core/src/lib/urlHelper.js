import url from 'url';
import diacritics from 'diacritics';
import sanitizeFilename from 'sanitize-filename';
import { isString, escapeRegExp, flow, partialRight } from 'lodash';
import { Map } from 'immutable';

function getUrl(urlString, direct) {
  return `${ direct ? '/#' : '' }${ urlString }`;
}

export function getCollectionUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }`, direct);
}

export function getNewEntryUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }/new`, direct);
}

export function addParams(urlString, params) {
  const parsedUrl = url.parse(urlString, true);
  parsedUrl.query = { ...parsedUrl.query, ...params };
  return url.format(parsedUrl);
}

export function stripProtocol(urlString) {
  const protocolEndIndex = urlString.indexOf('//');
  return protocolEndIndex > -1 ? urlString.slice(protocolEndIndex + 2) : urlString;
}

/* See https://www.w3.org/International/articles/idn-and-iri/#path.
 * According to the new IRI (Internationalized Resource Identifier) spec, RFC 3987,
 *   ASCII chars should be kept the same way as in standard URIs (letters digits _ - . ~).
 * Non-ASCII chars (unless they are not in the allowed "ucschars" list) should be percent-encoded.
 * If the string is not encoded in Unicode, it should be converted to UTF-8 and normalized first,
 *   but JS stores strings as UTF-16/UCS-2 internally, so we should not normallize or re-encode.
 */
const uriChars = /[\w\-.~]/i;
const ucsChars = /[\xA0-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}]/u;
const validURIChar = char => uriChars.test(char);
const validIRIChar = char => uriChars.test(char) || ucsChars.test(char);
// `sanitizeURI` does not actually URI-encode the chars (that is the browser's and server's job), just removes the ones that are not allowed.
export function sanitizeURI(str, { replacement = "", encoding = "unicode" } = {}) {
  if (!isString(str)) {
    throw new Error("The input slug must be a string.");
  }
  if (!isString(replacement)) {
    throw new Error("`options.replacement` must be a string.");
  }
  
  let validChar;
  if (encoding === "unicode") {
    validChar = validIRIChar;
  } else if (encoding === "ascii") {
    validChar = validURIChar;
  } else {
    throw new Error('`options.encoding` must be "unicode" or "ascii".');
  }

  // Check and make sure the replacement character is actually a safe char itself.
  if (!Array.from(replacement).every(validChar)) {
    throw new Error("The replacement character(s) (options.replacement) is itself unsafe.");
  }

  // `Array.from` must be used instead of `String.split` because
  //   `split` converts things like emojis into UTF-16 surrogate pairs.
  return Array.from(str).map(char => (validChar(char) ? char : replacement)).join('');
}

export function sanitizeSlug(str, options = Map()) {
  const encoding = options.get('encoding', 'unicode');
  const stripDiacritics = options.get('clean_accents', false);
  const replacement = options.get('sanitize_replacement', '-');

  if (!isString(str)) { throw new Error("The input slug must be a string."); }
  
  const sanitizedSlug = flow([
    ...(stripDiacritics ? [diacritics.remove] : []),
    partialRight(sanitizeURI, { replacement, encoding }),
    partialRight(sanitizeFilename, { replacement }),
  ])(str);

  // Remove any doubled or trailing replacement characters (that were added in the sanitizers).
  const doubleReplacement = new RegExp(`(?:${ escapeRegExp(replacement) })+`, 'g');
  const trailingReplacment = new RegExp(`${ escapeRegExp(replacement) }$`);
  const normalizedSlug = sanitizedSlug
    .replace(doubleReplacement, replacement)
    .replace(trailingReplacment, '');

  return normalizedSlug;
}
