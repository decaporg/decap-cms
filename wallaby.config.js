process.env.BABEL_ENV = 'test';

module.exports = wallaby => ({
  files: [
    { pattern: 'src/**/*.js' },
    { pattern: 'src/**/*.spec.js', ignore: true },
  ],

  tests: [
    { pattern: 'src/**/*.spec.js' },
  ],

  compilers: {
    'src/**/*.js': wallaby.compilers.babel(),
  },

  env: {
    type: 'node',
    runner: 'node',
  },

  testFramework: 'jest',

  setup: (wb) => {
    wb.testFramework.configure({
      globals: {
        CMS_ENV: 'development',
      },
    });
  },
});
