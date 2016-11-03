import { List } from 'immutable';
import consoleError from '../lib/consoleError';

function tryFields(tries, entry) {
  if (entry.get('data')) {
    // Looks through a list of possible, hard coded "tries".
    const key = tries.find(possibleKey => entry.hasIn(['data', possibleKey]));
    return key && entry.getIn(['data', key]);
  }
  return null;
}

export function inferTitle(collection, entry) {
  // Entries can have a 'Label' field
  // (but so far it's only used by single file collection nested entries)
  if (entry.get('label')) return entry.get('label');

  // As a last option, searches for the first string field in collection data
  const tentativeTitle = tryFields([
    'title',
    'name',
    'label',
    collection.get('fields', List()).filter(field => field.get('widget') === 'string').getIn([0, 'name'], null),
  ], entry);

  if (tentativeTitle) return tentativeTitle;

  consoleError(
    `Title is missing for the collection “${ collection.get('name') }”`,
    `Netlify CMS tries to infer the entry title automatically, but one couldn\'t be found for entries of the collection “${ collection.get('name') }”. Please check your site configuration.`
  );
  return 'Post title not found.';
}

export function inferBody(collection, entry) {
  const tentativeTitle = tryFields([
    'shortDescription',
    'short_description',
    'shortdescription',
    'description',
    'content',
    'body',
  ], entry);
  if (tentativeTitle) return tentativeTitle;
  return null;
}

export function inferImage(collection, entry) {
  const tentativeImage = tryFields([
    'image',
    'thumbnail',
    'thumb',
    'picture',
    collection.get('fields', List()).filter(field => field.get('widget') === 'image').getIn([0, 'name'], null),
  ], entry);
  if (tentativeImage) return tentativeImage;
  return null;
}


export function createEntry(collection, slug = '', path = '', options = {}) {
  const returnObj = {};
  returnObj.collection = collection;
  returnObj.slug = slug;
  returnObj.path = path;
  returnObj.partial = options.partial || false;
  returnObj.raw = options.raw || '';
  returnObj.data = options.data || {};
  returnObj.label = options.label || null;
  returnObj.metaData = options.metaData || null;
  return returnObj;
}
