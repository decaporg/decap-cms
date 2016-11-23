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
      'webpack/hot/dev-server',
      `webpack-dev-server/client?http://${ HOST }:${ PORT }/`,
      'react-hot-loader/patch',
      './index',
    ],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: `http://${ HOST }:${ PORT }/`,
    library: 'netlify-cms',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  context: path.join(__dirname, 'src'),
  module: {
    loaders: [
      {
        loader: 'babel',
        test: /\.js?$/,
        exclude: /node_modules/,
        query: {
          plugins: [
            'react-hot-loader/babel',
          ],
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
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin('[name].css', { disable: true }),
  ],
  devServer: {
    hot: true,
    contentBase: 'example/',
    historyApiFallback: true,
    devTool: 'cheap-module-source-map',
  },
});
