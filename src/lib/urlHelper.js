import url from 'url';
import removeAccents from 'remove-nonspacing';
import { Ll, Lm, Lo, Lt, Lu, Mc, Me, Mn } from 'unicode-tables/category';
const Marks = new Set([...Mc, ...Me, ...Mn]);
const Letters = new Set([...Ll, ...Lm, ...Lo, ...Lt, ...Lu]);

function isMark(r) {
  return Marks.has(r.codePointAt(0));
}

function isLetter(r) {
  return Letters.has(r.codePointAt(0));
}

function getUrl(url, direct) {
  return `${ direct ? '/#' : '' }${ url }`;
}

export function getCollectionUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }`, direct);
}

export function getNewEntryUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }/entries/new`, direct);
}

export function urlize(string, options) {
  const sanitized = makePathSanitized(string, options);
  const parsedURL = url.parse(sanitized);

  return url.format(parsedURL);
}

function makePathSanitized(string, { pathToLower = true, removePathAccents = false }) {
  let result = makePath(string);
  if (removePathAccents) {
    result = removeAccents(result);
  }
  if (pathToLower) {
    result = result.toLowerCase();
  }
  return result;
}

function makePath(string) {
  return unicodeSanitize(string.trim().replace(/[ ]/g, '-'));
}

function unicodeSanitize(string) {
  let target = [];
  const runes = string.split('');
  for (let i=0; i < string.length; i++) {
    const r = runes[i];
    if (r == '%' && i+2 < string.length && string.substr(i+1, 2).match(/^[0-9a-f]+$/)) {
      target = target.concat([r, runes[i+1], runes[i+2]]);
    } else if (r.match(/[\d.\/\\_#\+\-~]/u) || isLetter(r) || isMark(r)) {
      target.push(r);
    }
  }
  return target.join('');
}
