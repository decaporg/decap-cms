const os = require('os');
const path = require('path');
const cache = require('cache-me-outside');

cache({
  cacheFolder: path.join('/', 'opt', 'build', 'cache', 'fast-cache'),
  contents: [
    {
      path: path.join(os.homedir(), '.cache', 'Cypress'),
      invalidateOn: __filename,
      command: 'echo noop',
    },
  ],
  ignoreIfFolderExists: false,
});
