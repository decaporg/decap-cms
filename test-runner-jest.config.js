const { getJestConfig } = require('@storybook/test-runner');

// The default Jest configuration comes from @storybook/test-runner
const testRunnerConfig = getJestConfig();

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  ...testRunnerConfig,
  testMatch: ['<rootDir>/packages/*/src/**/*.(story|stories).(js|jsx|ts|tsx|mdx)'],
  snapshotSerializers: ['@emotion/jest/serializer'],
};

module.exports = config;
