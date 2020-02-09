module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setupTestFramework.js'],
  moduleNameMapper: {
    'netlify-cms-lib-auth': '<rootDir>/packages/netlify-cms-lib-auth/src/index.js',
    'netlify-cms-lib-util': '<rootDir>/packages/netlify-cms-lib-util/src/index.ts',
    'netlify-cms-ui-legacy': '<rootDir>/packages/netlify-cms-ui-legacy/src/index.js',
    'netlify-cms-backend-github': '<rootDir>/packages/netlify-cms-backend-github/src/index.ts',
  },
  testURL: 'http://localhost:8080',
};
