/* eslint global-require: 0 */

const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        /* CSS loader for npm modules that are shipped with CSS that should be loaded without processing.
           List all of theme in the array
        */
        test: /\.css$/,
        include: [/redux-notifications/, /reboot.css/],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        /* We use PostCSS for CMS styles */
        test: /\.css$/,
        exclude: [/node_modules/],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            { loader: 'postcss-loader' },
          ],
        }),
      },
      {
        include: [/src\/icons/],
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'svg-inline-loader',
      },
      {
        exclude: [/src\/icons/],
        test: /\.(png|eot|woff|woff2|ttf|gif|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: { loader: "url-loader", options: { limit: 10000 } },
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin(/^esprima$/, /js-yaml/), // Ignore Esprima import for js-yaml
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // Ignore all optional deps of moment.js
  ],
  target: 'web', // Make web variables accessible to webpack, e.g. window
};
