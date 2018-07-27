const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const coreWebpackConfig = require('../netlify-cms-core/webpack.config.js');

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  ...coreWebpackConfig,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  plugins: [
    ...coreWebpackConfig.plugins.filter(plugin => !plugin instanceof webpack.DefinePlugin),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
      NETLIFY_CMS_CORE_VERSION: null,
    }),
  ],
};

module.exports = [
  baseConfig,

  /**
   * Output the same script a second time, but named `cms.js`, and with a
   * deprecation notice.
   */
  {
    ...baseConfig,
    entry: [
      path.join(__dirname, 'scripts/deprecate-old-dist.js'),
      baseConfig.entry,
    ],
    output: {
      ...baseConfig.output,
      filename: 'dist/cms.js',
    },
  },
];
