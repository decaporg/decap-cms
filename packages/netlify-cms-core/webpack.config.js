const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const pkg = require('./package.json');
const { getConfig, plugins  } = require('../../scripts/webpack.js');
const baseWebpackConfig = getConfig({ baseOnly: true });

const isProduction = process.env.NODE_ENV === 'production';
const devServerPort = parseInt(process.env.NETLIFY_CMS_DEV_SERVER_PORT || `${8080}`);

const baseConfig = {
  ...baseWebpackConfig,
  plugins: [
    ...Object.entries(plugins)
      .filter(([key]) => key !== 'friendlyErrors')
      .map(([, plugin]) => plugin()),
    new webpack.DefinePlugin({
      NETLIFY_CMS_CORE_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
    }),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [`Netlify CMS is now running at http://localhost:${devServerPort}`],
      },
    })
  ],
  devServer: {
    contentBase: '../../dev-test',
    watchContentBase: true,
    publicPath: '/dist',
    quiet: true,
    host: '0.0.0.0',
    port: devServerPort,
  },
};

module.exports = baseConfig;
