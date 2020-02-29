module.exports = {
  stories: [
    '../packages/netlify-cms-ui-default/src/**/?(*.)(story|stories).(js|jsx|mdx)',
    '../packages/netlify-cms-core/src/**/*.stories.js',
    '../packages/netlify-cms-ui-legacy/src/**/*.stories.js',
  ],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-knobs',
    '@storybook/addon-links',
    '@storybook/addon-docs',
    'storybook-dark-mode',
    '@storybook/addon-viewport',
  ],
};
