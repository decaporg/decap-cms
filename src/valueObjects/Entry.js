export function createEntry(path = '', slug = '', raw = '') {
  const returnObj = {};
  returnObj.path = path;
  returnObj.slug = slug;
  returnObj.raw = raw;
  returnObj.data = {};
  returnObj.metaData = {};
  return returnObj;
}
