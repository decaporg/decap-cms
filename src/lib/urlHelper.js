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
  return getUrl(`/collections/${ collectionName }/entries/new`, direct);
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
// `sanitizeIRI` does not actually URI-encode the chars (that is the browser's and server's job), just removes the ones that are not allowed.
export function sanitizeIRI(str, { replacement = "" } = {}) {
  if (!isString(replacement)) throw "`options.replacement` must be a string.";
  if (replacement !== "") {
    const validReplacement = (sanitizeIRI(replacement) === replacement);
    if (!validReplacement) throw "The replacement character(s) (options.replacement) is itself unsafe.";
  }

  let result = "";
  // We cannot use a `map` function here because `string.split()`
  //   splits things like emojis into UTF-16 surrogate pairs,
  //   and we want to use UTF-8 (it isn't required, but is nicer).
  for (const char of str) {
    if (uriChars.test(char) || ucsChars.test(char)) {
      result += char;
    } else {
      result += replacement;
    }
  }
  return result;
}

export function sanitizeSlug(str, { replacement = '-' } = {}) {
  if (!isString(str)) throw "The input slug must be a string.";
  if (!isString(replacement)) throw "`options.replacement` must be a string.";
  
  // Sanitize as IRI (i18n URI) and as filename.
  const sanitize = flow([
    partialRight(sanitizeIRI, { replacement }),
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

export function urlize(string) {
  const sanitized = makePathSanitized(string);
  const parsedURL = url.parse(sanitized);

  return url.format(parsedURL);
}

function makePathSanitized(string) {
  return makePath(string.toLowerCase());
}

function makePath(string) {
  return unicodeSanitize(string).trim().replace(/[\s]/g, '-').replace(/-+/g, '-');
}

function unicodeSanitize(string) {
  let target = [];
  const runes = string.split('');
  for (let i=0; i < string.length; i++) {
    const r = runes[i];
    if (r == '%' && i+2 < string.length && string.substr(i+1, 2).match(/^[0-9a-f]+$/)) {
      target = target.concat([r, runes[i+1], runes[i+2]]);
    } else if (r.match(/[\w .\/\\_#\+-]/u)) {
      target.push(r);
    }
  }
  return target.join('');
}
