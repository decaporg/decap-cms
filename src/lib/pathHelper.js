const absolutePath = new RegExp('^(?:[a-z]+:)?//', 'i');
const normalizePath = path => path.replace(/[\\\/]+/g, '/');

export function resolvePath(path, basePath) { // eslint-disable-line
  // No path provided, skip
  if (!path) return null;

  // It's an absolute path.
  if (absolutePath.test(path)) return normalizePath(path);

  if (path.indexOf('/') === -1) {
    // It's a single file name, no directories. Prepend public folder
    return normalizePath(`/${ basePath }/${ path }`);
  }

  // It's a relative path. Prepend a forward slash.
  return normalizePath(`/${ path }`);
}
