const absolutePath = new RegExp('^(?:[a-z]+:)?//', 'i');
const normalizePath = path => path.replace(/[\\/]+/g, '/');

export function resolvePath(path, basePath) {
  // No path provided, skip
  if (!path) return null;

  // It's an absolute path.
  if (absolutePath.test(path)) return path;

  if (path.indexOf('/') === -1) {
    // It's a single file name, no directories. Prepend public folder
    return normalizePath(`/${basePath}/${path}`);
  }

  // It's a relative path. Prepend a forward slash.
  return normalizePath(`/${path}`);
}

/**
 * Return the last portion of a path. Similar to the Unix basename command.
 * @example Usage example
 *   path.basename('/foo/bar/baz/asdf/quux.html')
 *   // returns
 *   'quux.html'
 *
 *   path.basename('/foo/bar/baz/asdf/quux.html', '.html')
 *   // returns
 *   'quux'
 */
export function basename(p, ext = '') {
  // Special case: Normalize will modify this to '.'
  if (p === '') {
    return p;
  }
  // Normalize the string first to remove any weirdness.
  p = normalizePath(p);
  // Get the last part of the string.
  const sections = p.split('/');
  const lastPart = sections[sections.length - 1];
  // Special case: If it's empty, then we have a string like so: foo/
  // Meaning, 'foo' is guaranteed to be a directory.
  if (lastPart === '' && sections.length > 1) {
    return sections[sections.length - 2];
  }
  // Remove the extension, if need be.
  if (ext.length > 0) {
    const lastPartExt = lastPart.substr(lastPart.length - ext.length);
    if (lastPartExt === ext) {
      return lastPart.substr(0, lastPart.length - ext.length);
    }
  }
  return lastPart;
}

/**
 * Return the extension of the path, from the last '.' to end of string in the
 * last portion of the path. If there is no '.' in the last portion of the path
 * or the first character of it is '.', then it returns an empty string.
 * @example Usage example
 *   path.fileExtensionWithSeparator('index.html')
 *   // returns
 *   '.html'
 */
export function fileExtensionWithSeparator(p) {
  p = normalizePath(p);
  const sections = p.split('/');
  p = sections.pop();
  // Special case: foo/file.ext/ should return '.ext'
  if (p === '' && sections.length > 0) {
    p = sections.pop();
  }
  if (p === '..') {
    return '';
  }
  const i = p.lastIndexOf('.');
  if (i === -1 || i === 0) {
    return '';
  }
  return p.substr(i);
}

/**
 * Return the extension of the path, from after the last '.' to end of string in the
 * last portion of the path. If there is no '.' in the last portion of the path
 * or the first character of it is '.', then it returns an empty string.
 * @example Usage example
 *   path.fileExtension('index.html')
 *   // returns
 *   'html'
 */
export function fileExtension(p) {
  const ext = fileExtensionWithSeparator(p);
  return ext === '' ? ext : ext.substr(1);
}
