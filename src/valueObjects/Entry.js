/* eslint import/prefer-default-export: 0 */

export function createEntry(path = '', slug = '', raw = '') {
  return {
    path,
    slug,
    raw,
    data: {},
    metaData: {},
  };
}
