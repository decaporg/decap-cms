module.exports = {
  stories: ['../packages/**/src/**/?(*.)(story|stories).(js|jsx|mdx)'],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-knobs',
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-viewport',
    '@storybook/addon-storysource',
    'storybook-dark-mode',
  ],
  webpackFinal: config => {
    config.resolve.symlinks = true;
    config.module.rules.push({
      test: /(story|stories).(js|jsx|mdx)/,
      loaders: [require.resolve('@storybook/source-loader')],
      enforce: 'pre',
    });

    const excludePaths = [/node_modules/, /dist/];
    const jsRule = config.module.rules.find(rule => rule.test.test('.jsx'));
    jsRule.exclude = excludePaths;

    const babelConfig = jsRule.use.find(({ loader }) => loader === 'babel-loader');
    babelConfig.options.sourceType = 'unambiguous';

    config.resolve.alias.react = require.resolve('react');

    return config;
  },
};
