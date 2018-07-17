const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const baseConfig = require('../../webpack.config.js');

module.exports = {
  ...baseConfig,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  module: {
    noParse: /\.css$/,
    ...baseConfig.module,
  },
  devServer: {
    contentBase: './example',
    watchContentBase: true,
    quiet: true,
    host: 'localhost',
    port: 8080,
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['Netlify CMS is now running at http://localhost:8080'],
      },
    }),
  ],
};
