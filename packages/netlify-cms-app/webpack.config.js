const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const pkg = require('./package.json');
const { getConfig, plugins } = require('../../scripts/webpack');
const baseWebpackConfig = getConfig({ baseOnly: true });

const isProduction = process.env.NODE_ENV === 'production';
console.log(`${pkg.version}${isProduction ? '' : '-dev'}`);

const baseConfig = {
  ...baseWebpackConfig,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  plugins: [
    ...Object.entries(plugins)
      .filter(([key]) => key !== 'friendlyErrors')
      .map(([, plugin]) => plugin()),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(`- app - ${pkg.version}${isProduction ? '' : '-dev'}`),
      NETLIFY_CMS_CORE_VERSION: null,
    }),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['Netlify CMS is now running at http://localhost:8080'],
      },
    }),
  ],
  devServer: {
    contentBase: '../../dev-test',
    watchContentBase: true,
    publicPath: '/dist/',
    quiet: true,
    host: 'localhost',
    port: 8080,
  },
};

module.exports = baseConfig;
