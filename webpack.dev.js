/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');

module.exports = merge.smart(require('./webpack.base.js'), {
  mode: 'development',
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
  module: {
    noParse: /localforage\.js/,
    rules: [
      {
        loader: path.resolve(__dirname, './node_modules/babel-loader'),
        test: /\.js?$/,
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(require("./package.json").version + "-dev"),
    }),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  devtool: 'source-map',
  serve: {
    content: 'example/',
    dev: {
      headers: {"Access-Control-Allow-Origin": "*"},
    },
  },
});
