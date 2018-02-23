import url from 'url';
import sanitizeFilename from 'sanitize-filename';
import { isString, escapeRegExp, flow, partialRight } from 'lodash';

function getUrl(url, direct) {
  return `${ direct ? '/#' : '' }${ url }`;
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

export function stripProtocol(url) {
  const protocolEndIndex = url.indexOf('//');
  return protocolEndIndex > -1 ? url.slice(protocolEndIndex + 2) : url;
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
const validURIChar = (char) => (uriChars.test(char));
const validIRIChar = (char) => (uriChars.test(char) || ucsChars.test(char));
// `sanitizeURI` does not actually URI-encode the chars (that is the browser's and server's job), just removes the ones that are not allowed.
export function sanitizeURI(str, { replacement = "", type = "iri" } = {}) {
  if (!isString(str)) throw "The input slug must be a string.";
  if (!isString(replacement)) throw "`options.replacement` must be a string.";
  
  let validChar;
  if (type === "iri") {
    validChar = validIRIChar;
  } else if (type === "ascii") {
    validChar = validURIChar;
  } else {
    throw '`options.type` must be "iri" or "ascii".';
  }

  // Check and make sure the replacement character is actually a safe char itself.
  if (!Array.from(replacement).every(validChar)) throw "The replacement character(s) (options.replacement) is itself unsafe.";

  // `Array.from` must be used instead of `String.split` because
  //   `split` converts things like emojis into UTF-16 surrogate pairs.
  return Array.from(str).map(char => (validChar(char) ? char : replacement)).join('');
}

export function sanitizeSlug(str, { replacement = '-', slugType } = {}) {
  if (!isString(str)) throw "The input slug must be a string.";
  if (!isString(replacement)) throw "`options.replacement` must be a string.";
  
  // Sanitize as URI and as filename.
  const sanitize = flow([
    partialRight(sanitizeURI, { replacement, type: slugType }),
    partialRight(sanitizeFilename, { replacement }),
  ]);
  const sanitizedSlug = sanitize(str);
  
  // Remove any doubled or trailing replacement characters (that were added in the sanitizers).
  const doubleReplacement = new RegExp('(?:' + escapeRegExp(replacement) + ')+', 'g');
  const trailingReplacment = new RegExp(escapeRegExp(replacement) + '$');
  const normalizedSlug = sanitizedSlug
    .replace(doubleReplacement, replacement)
    .replace(trailingReplacment, '');

  return normalizedSlug;
}
