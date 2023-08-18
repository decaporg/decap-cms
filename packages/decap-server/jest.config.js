module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    'decap-cms-lib-util': '<rootDir>/../decap-cms-lib-util/dist/esm',
  },
};
