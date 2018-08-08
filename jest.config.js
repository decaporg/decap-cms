module.exports = {
  setupTestFrameworkScriptFile: '<rootDir>/setupTestFramework.js',
  transform: {
    '\\.js$': '<rootDir>/custom-preprocessor.js',
  },
  moduleNameMapper: {
    'netlify-cms-lib-util': '<rootDir>/packages/netlify-cms-lib-util/src/index.js',
    'netlify-cms-ui-default': '<rootDir>/packages/netlify-cms-ui-default/src/index.js',
  },
  testURL: 'http://localhost:8080',
};
