/* eslint global-require: 0 */

const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  module: {
    loaders: [
      {
        loader: 'babel',
        test: /\.js?$/,
        exclude: /node_modules/,
      },
      {
        /* CSS loader for npm modules that are shipped with CSS.
           List all of theme in the array
        */
        test: /\.css$/,
        include: [/redux-notifications/],
        loader: ExtractTextPlugin.extract('style', 'css'),
      },
      {
        /* React-toolbox still relies on SCSS and css-modules */
        test: /\.scss$/,
        include: [/react-toolbox/],
        loader: ExtractTextPlugin.extract('style', 'css?modules!sass'),
      },
      {
        /* We use CSS-modules and PostCSS for CMS styles */
        test: /\.css$/,
        exclude: /node_modules/,
        loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=1&&localIdentName=cms__[name]__[local]!postcss'),
      },
      {
        test: /\.(png|eot|woff|woff2|ttf|svg|gif)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
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
