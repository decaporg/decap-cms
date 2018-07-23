const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const baseConfig = require('../../webpack.config.js');

module.exports = {
  ...baseConfig,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  module: {
    rules: [
      ...baseConfig.module.rules,
      {
        test: /\.css$/,
        include: [/redux-notifications/],
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
  devServer: {
    contentBase: './example',
    watchContentBase: true,
    quiet: true,
    host: 'localhost',
    port: 8080,
  },
  plugins: [
    ...baseConfig.plugins.filter(plugin => !plugin instanceof FriendlyErrorsWebpackPlugin),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['Netlify CMS is now running at http://localhost:8080'],
      },
    }),
  ],
};
