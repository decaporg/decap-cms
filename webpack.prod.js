/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

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
  context: path.join(__dirname, 'src'),
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(require("./package.json").version),
    }),

    // Combine/hoist module scopes when possible.
    new webpack.optimize.ModuleConcatenationPlugin(),

    // Minify and optimize the JavaScript
    new UglifyJsPlugin({
      sourceMap: true,
    }),

    // Extract CSS
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true
    }),

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
