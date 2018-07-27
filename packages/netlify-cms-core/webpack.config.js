const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const { getConfig, rules, plugins } = require('../../scripts/webpack.js');

const isProduction = process.env.NODE_ENV === 'production';

const entry = () => {
  const defaultEntry = ['./index.js'];

  if (isProduction) {
    return defaultEntry;
  }

  return [
    ...defaultEntry,
    '../scripts/load-extensions.js',
  ];
};

module.exports = {
  ...getConfig(),
  context: path.join(__dirname, 'src'),
  entry: entry(),
  module: {
    rules: [
      ...Object.entries(rules)
        .filter(([ key ]) => key !== 'js')
        .map(([ _, rule ]) => rule()),
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.join(__dirname, 'babel.config.js'),
          },
        },
      },
      {
        test: /\.css$/,
        include: [/(redux-notifications|react-datetime)/],
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    ...Object.entries(plugins)
      .filter(([ key ]) => key !== 'friendlyErrors')
      .map(([ _, plugin ]) => plugin()),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: null,
      NETLIFY_CMS_CORE_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
    }),
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
