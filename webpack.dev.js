/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
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
  },
  context: path.join(__dirname, 'src'),
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({
      fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
    }),
  ],
  devServer: {
    hot: true,
    contentBase: 'example/',
    historyApiFallback: true,
    devTool: 'cheap-module-source-map',
  },
});
