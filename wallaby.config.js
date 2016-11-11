/* eslint global-require: 0 */
/* eslint import/no-extraneous-dependencies: 0 */

process.env.BABEL_ENV = 'test';

module.exports = wallaby => ({
  files: [
    'package.json',
    'src/**/*.js',
    'src/**/*.js.snap',
    '!src/**/*.spec.js',
    { pattern: 'src/**/*.css', instrument: false },
  ],

  tests: ['src/**/*.spec.js'],

  compilers: {
    'src/**/*.js': wallaby.compilers.babel(),
  },

  env: {
    type: 'node',
    runner: 'node',
    params: {
      runner: '--harmony_proxies',
    },
  },

  testFramework: 'jest',

  setup: () => {
    wallaby.testFramework.configure({
      moduleNameMapper: {
        '^.+\\.(png|eot|woff|woff2|ttf|svg|gif)$': require('path').join(wallaby.localProjectDir, '__mocks__', 'fileLoaderMock.js'),
        '^.+\\.s?css$': require('path').join(wallaby.localProjectDir, '__mocks__', 'styleLoaderMock.js'),
      },
    });
  },

});
