const path = require('path');

const decapPackage = path.join(__dirname, 'packages', 'decap') + path.sep;

module.exports = (request, options) => {
  if (/^(?:platejs|@platejs\/[^/]+)\/react$/.test(request)) {
    return require.resolve(request, { paths: [options.basedir] });
  }

  // packages/decap is ESM TypeScript and imports siblings as `./api.js`, as
  // node16 resolution requires. Strip the extension there so jest finds the
  // .ts; everywhere else a `.js` import means the .js file.
  if (/^\.{1,2}\/.*\.js$/.test(request) && (options.basedir + path.sep).startsWith(decapPackage)) {
    return options.defaultResolver(request.slice(0, -3), options);
  }

  return options.defaultResolver(request, options);
};
