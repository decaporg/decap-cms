/* global module, __dirname, require */
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

const HOST = 'localhost';
const PORT = '8080';

module.exports = {
  module: {
    loaders: [
      {
        test: /\.((png)|(eot)|(woff)|(woff2)|(ttf)|(svg)|(gif))(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=100000'
      },
      { test: /\.json$/, loader: 'json-loader' },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style", "css?modules&importLoaders=1&&localIdentName=cms__[name]__[local]!postcss"),
      },
      {
        loader: 'babel',
        test: /\.js?$/,
        exclude: /(node_modules|bower_components)/,
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015'],
          plugins: [
            'transform-class-properties',
            'transform-object-assign',
            'transform-object-rest-spread',
            'lodash',
            'react-hot-loader/babel'
          ]
        }
      }
    ]
  },

  postcss: [
    require('postcss-import')({ addDependencyTo: webpack }),
    require('postcss-cssnext')
  ],

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin('cms.css', { allChunks: true }),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ],

  context: path.join(__dirname, 'src'),
  entry: {
    cms: [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?http://${HOST}:${PORT}/`,
      'react-hot-loader/patch',
      './index'
    ],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: `http://${HOST}:${PORT}/`,
  },
  externals: [/^vendor\/.+\.js$/],
  devServer: {
    hot: true,
    contentBase: 'example/',
    historyApiFallback: true,
    devTool: 'cheap-module-source-map'
  },
};
