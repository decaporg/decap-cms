const path = require('path');

module.exports = {
  stories: ['../packages/**/src/**/?(*.)(story|stories).(js|jsx|ts|tsx|mdx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-storysource',
    '@storybook/addon-a11y',
    'storybook-addon-deep-controls',
    'storybook-dark-mode',
    '@storybook/addon-webpack5-compiler-babel',
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: false,
      },
    },
  },

  webpackFinal: async (config) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'decap-cms-ui-next': path.resolve(__dirname, '../packages/decap-cms-ui-next/src'),
      'decap-cms-locales': path.resolve(__dirname, '../packages/decap-cms-locales/src'),
    };
    return config;
  },
};
