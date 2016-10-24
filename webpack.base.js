/* eslint global-require: 0 */

const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  module: {
    loaders: [
      {
        test: /\.(png|eot|woff|woff2|ttf|svg|gif)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css?modules!sass'),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=1&&localIdentName=cms__[name]__[local]!postcss'),
      },
      {
        loader: 'babel',
        test: /\.js?$/,
        exclude: /node_modules/,
      },
    ],
  },
  postcss: [
    require('postcss-import')({ addDependencyTo: webpack }),
    require('postcss-cssnext')({
      browsers: ['last 2 versions', 'IE > 10'],
    }),
  ],
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // Ignore all optional deps of moment.js
    new webpack.ProvidePlugin({
      fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
    }),
  ],
  target: 'web', // Make web variables accessible to webpack, e.g. window
};
