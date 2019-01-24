const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const pkg = require('./package.json');
const { plugins } = require('../../scripts/webpack');
const coreWebpackConfig = require('../netlify-cms-core/webpack.config.js');

const isProduction = process.env.NODE_ENV === 'production';
const { PORT = 8080, HOST = 'localhost' } = process.env;

const baseConfig = {
  ...coreWebpackConfig,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  plugins: [
    ...Object.entries(plugins)
      .filter(([key]) => key !== 'friendlyErrors')
      .map(([, plugin]) => plugin()),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
      NETLIFY_CMS_CORE_VERSION: null,
    }),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [`Netlify CMS is now running at http://${HOST}:${PORT}`],
      },
    }),
  ],
  devServer: {
    contentBase: '../../dev-test',
    watchContentBase: true,
    quiet: true,
    host: HOST,
    port: PORT,
  },
};

module.exports = baseConfig;
