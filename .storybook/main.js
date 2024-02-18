import { dirname, join } from 'path';

export default {
  stories: [
    '../packages/decap-cms-ui-next/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/decap-cms-backend-test/src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-storysource'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('storybook-addon-deep-controls'),
    getAbsolutePath('storybook-dark-mode'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },

  docs: {
    autodocs: true,
  },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')));
}
