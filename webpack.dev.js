/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const HOST = 'localhost';
const PORT = '8080';

module.exports = merge.smart(require('./webpack.base.js'), {
  entry: {
    cms: [
      'react-hot-loader/patch',
      `webpack-dev-server/client?http://${ HOST }:${ PORT }/`,
      './index',
    ],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: `/admin/`,
    library: 'netlify-cms',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  context: path.join(__dirname, 'src'),
  module: {
    noParse: /localforage\.js/,
    loaders: [
      {
        loader: path.resolve(__dirname, './node_modules/babel-loader'),
        test: /\.js?$/,
        exclude: /node_modules/,
        query: {
          plugins: [path.resolve(__dirname, './node_modules/react-hot-loader/babel')],
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(require("./package.json").version + "-dev"),
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin('[name].css'),
  ],
  devtool: 'source-map',
  devServer: {
    hot: true,
    contentBase: 'example/site/',
    historyApiFallback: true,
    disableHostCheck: true,
    headers: { "Access-Control-Allow-Origin": "*" },
  },
});
