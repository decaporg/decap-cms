const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const { getConfig, plugins } = require('../../scripts/webpack.js');

module.exports = {
  ...getConfig(),
  plugins: [
    ...Object.entries(plugins)
      .filter(([ key ]) => key !== 'friendlyErrors')
      .map(([ _, plugin ]) => plugin()),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['Netlify CMS is now running at http://localhost:8080'],
      },
    }),
  ],
  devServer: {
    contentBase: './example',
    watchContentBase: true,
    quiet: true,
    host: 'localhost',
    port: 8080,
  },
};
