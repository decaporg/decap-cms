module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setupTestFramework.js'],
  moduleNameMapper: {
    '^platejs/react$': '<rootDir>/node_modules/platejs/dist/react/index.js',
    '^(@platejs/.+)/react$': '<rootDir>/node_modules/$1/dist/react/index.js',
    'decap-cms-lib-auth': '<rootDir>/packages/decap-cms-lib-auth/src/index.js',
    'decap-cms-lib-util': '<rootDir>/packages/decap-cms-lib-util/src/index.ts',
    'decap-cms-ui-default': '<rootDir>/packages/decap-cms-ui-default/src/index.js',
    'decap-cms-backend-github': '<rootDir>/packages/decap-cms-backend-github/src/index.ts',
    'decap-cms-lib-widgets': '<rootDir>/packages/decap-cms-lib-widgets/src/index.ts',
    'decap-cms-widget-object': '<rootDir>/packages/decap-cms-widget-object/src/index.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    '^#home-directory$': 'clean-stack/home-directory.js',
  },
  modulePathIgnorePatterns: ['.nx', 'dist'],
  snapshotSerializers: ['@emotion/jest/serializer'],
  transformIgnorePatterns: [
    'node_modules/(?!.*(?:copy-text-to-clipboard|clean-stack|escape-string-regexp|jotai-optics|nanoid))',
  ],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:8080',
  },
};
