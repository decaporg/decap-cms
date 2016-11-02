import consoleError from '../lib/consoleError';

export function inferTitle(collection, entry) {
  consoleError(
    `Title is missing for the collection “${ collection.get('name') }”`,
    `Netlify CMS tries to infer the entry title automatically, but one couldn\'t be found for entries of the collection “${ collection.get('name') }”. Please check your site configuration.`
  );
  // Entries can have a 'Label' field
  // (but so far it's only used by single file collection nested entries)
  if (entry.get('label')) return entry.get('label');

  if (entry.get('data')) {
    // Looks through a list of possible, hard coded "tries".
    // As a last option, searches for the first string field in collection data
    const tries = [
      'title',
      'name',
      'label',
      collection.get('fields').filter(field => field.get('widget') === 'string').first().get('name'),
    ];

    const key = tries.find(possibleKey => entry.hasIn(['data', possibleKey]));
    if (key) return entry.getIn(['data', key]);
  }

  return 'Post title not found.';
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
