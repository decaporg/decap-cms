module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    'netlify-cms-lib-util': '<rootDir>/../netlify-cms-lib-util/dist/esm',
  },
};
