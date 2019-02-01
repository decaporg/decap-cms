const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const { getConfig, rules } = require('../../scripts/webpack.js');

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = getConfig();

module.exports = {
  ...baseConfig,
  context: path.join(__dirname, 'src'),
  entry: ['./index.js'],
  module: {
    rules: [
      ...Object.entries(rules)
        .filter(([key]) => key !== 'js')
        .map(([, rule]) => rule()),
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
        include: [/(ol|redux-notifications|react-datetime)/],
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: null,
      NETLIFY_CMS_CORE_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
    }),
  ],
};
