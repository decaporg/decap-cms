module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setupTestFramework.js'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
  testURL: 'http://localhost:8080',
  snapshotSerializers: ['jest-emotion'],
  transformIgnorePatterns: [
    'node_modules/(?!copy-text-to-clipboard|clean-stack|escape-string-regexp)',
  ],
  testEnvironment: 'jsdom',
};
