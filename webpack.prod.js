/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = merge.smart(require('./webpack.base.js'), {
  entry: {
    cms: './index',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: 'netlify-cms',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=1!postcss'), // Use minified class names on production
      },
    ],
  },
  context: path.join(__dirname, 'src'),
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.optimize.OccurenceOrderPlugin(),

    // Minify and optimize the JavaScript
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        // ...but do not show warnings in the console (there is a lot of them)
        warnings: false,
      },
    }),

    // Extract CSS
    new ExtractTextPlugin('[name].css', { allChunks: true }),

    // During beta phase, generate source maps for better errors
    new webpack.SourceMapDevToolPlugin({
      // asset matching
      test: /\.js?$/,
      exclude: /node_modules/,

      // file and reference
      filename: '[file].map',
    }),
  ],
});
