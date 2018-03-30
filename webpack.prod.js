/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = merge.smart(require('./webpack.base.js'), {
  mode: 'production',
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
      NETLIFY_CMS_VERSION: JSON.stringify(require("./package.json").version),
    }),

    // Extract CSS
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),

    // During beta phase, generate source maps for better errors
    new webpack.SourceMapDevToolPlugin({
      // asset matching
      test: /\.js?$/,

      // file and reference
      filename: '[file].map',

      // don't include source file content, since we link to the actual file
      noSources: true,

      // sourcemap is in 'dist', webpack context is in 'src'
      moduleFilenameTemplate: info => path.posix.normalize(`../src/${info.resourcePath}`),
    }),
  ],
});