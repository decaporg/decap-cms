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
        include: [/redux-notifications/, /normalize.css/],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        /* React-toolbox relies on PostCSS and css-modules */
        test: /\.css$/,
        include: [/react-toolbox/],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: "[name]__[local]__[hash:base64:8]"
              },
            },
            { loader: 'postcss-loader' },
          ],
        }),
      },
      {
        /* We use CSS-modules and PostCSS for CMS styles */
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
        test: /\.(png|eot|woff|woff2|ttf|svg|gif)(\?v=\d+\.\d+\.\d+)?$/,
        use: { loader: "url-loader", options: { limit: 10000 } },
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin(/^esprima$/, /js-yaml/), // Ignore Esprima import for js-yaml
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // Ignore all optional deps of moment.js
    new webpack.ProvidePlugin({
      fetch: 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch',
    }),
  ],
  target: 'web', // Make web variables accessible to webpack, e.g. window
};
