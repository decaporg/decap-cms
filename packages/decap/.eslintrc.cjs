// This package is ESM TypeScript: siblings are imported as `./api.js`, as
// node16 resolution requires, and the repo's import resolver does not map
// `.js` back to `.ts`. `tsc` already proves every import resolves.
module.exports = {
  rules: {
    'import/no-unresolved': ['error', { ignore: ['^\\.{1,2}/.*\\.js$'] }],
  },
};
