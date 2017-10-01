import url from 'url';

function getUrl(url, direct) {
  return `${ direct ? '/#' : '' }${ url }`;
}

export function getCollectionUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }`, direct);
}

export function getNewEntryUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }/entries/new`, direct);
}

// Unreserved chars from RFC3987.
const uriChars = /[\w\-.~]/i;
const ucsChars = /[\xA0-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}]/u;
export function sanitizeIRI(str, { replacement }) {
  let result = "";
  // We cannot use a `map` function here because `string.split()` splits things like emojis into surrogate pairs.
  for (const char of str) {
    if (uriChars.test(char) || ucsChars.test(char)) {
      result += char;
    } else {
      result += replacement;
    }
  }
  return result;
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
