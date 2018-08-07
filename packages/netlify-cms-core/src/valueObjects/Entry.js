import { isBoolean } from 'lodash';

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
  returnObj.isModification = isBoolean(options.isModification) ? options.isModification : null;
  return returnObj;
}
