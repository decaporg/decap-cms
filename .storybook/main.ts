import type { StorybookConfig } from '@storybook/react-webpack5';

import { dirname, join } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../packages/**/src/**/?(*.)(story|stories).(js|jsx|ts|tsx|mdx)'],

  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-storysource'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('storybook-addon-deep-controls'),
    getAbsolutePath('storybook-dark-mode'),
    getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },
};
export default config;
