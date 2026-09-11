import sanitizeElementUrl from './sanitizeElementUrl';

// The link prompt is the one place where arbitrary clipboard contents can land
// in a link destination. A pasted paragraph is still serialized as valid
// markdown - `[text](<a whole sentence>)` - so it survives save and commit, and
// only surfaces much later as a broken link, or as a failed build on generators
// that resolve destinations against the filesystem. No real URL carries raw
// whitespace; percent-encoding is how a space is expressed.
const WHITESPACE = /\s/;

function isValidLinkUrl(url) {
  if (typeof url !== 'string' || url === '') {
    return false;
  }

  if (WHITESPACE.test(url)) {
    return false;
  }

  return sanitizeElementUrl(url) !== null;
}

export default isValidLinkUrl;
