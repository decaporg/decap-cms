/**
 * Browser polyfill for Node.js fileURLToPath function.
 * Converts file:// URLs to filesystem paths.
 *
 * @param {string | URL} url - File URL to convert
 * @returns {string} Filesystem path
 *
 * @example
 * fileURLToPath('file:///C:/path/') → 'C:\\path\\'  (Windows drive)
 * fileURLToPath('file://nas/foo.txt') → '\\\\nas\\foo.txt' (UNC path)
 * fileURLToPath('file:///你好.txt') → '/你好.txt' (decoded)
 * fileURLToPath('file:///hello world') → '/hello world' (decoded)
 */
export function fileURLToPath(url) {
  const urlStr = typeof url === 'string' ? url : url.toString();

  if (!urlStr.startsWith('file://')) {
    return urlStr;
  }

  // Parse the URL to handle all components properly
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    // If URL parsing fails, fall back to string manipulation
    return decodeURIComponent(urlStr.slice(7));
  }

  const { hostname, pathname } = parsed;

  // UNC path: file://hostname/path → \\hostname\path
  if (hostname && hostname !== 'localhost') {
    // Decode the pathname and replace forward slashes with backslashes
    const decodedPath = decodeURIComponent(pathname).replace(/\//g, '\\');
    return `\\\\${hostname}${decodedPath}`;
  }

  // Decode the pathname to handle encoded characters
  const path = decodeURIComponent(pathname);

  // Windows drive letter: file:///C:/path → C:\path
  // The pathname will be /C:/path, we need to remove leading / and convert slashes
  if (path.match(/^\/[A-Za-z]:/)) {
    // Remove leading slash and convert to Windows backslashes
    return path.slice(1).replace(/\//g, '\\');
  }

  // Unix path: file:///path → /path (already has leading slash)
  return path;
}
