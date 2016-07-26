/* global module, __dirname, require */
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

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
        loader: ExtractTextPlugin.extract("style", "css?modules&importLoaders=1!postcss"),
      },
      {
        loader: 'babel',
        test: /\.js?$/,
        exclude: /(node_modules|bower_components)/,
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015'],
          plugins: ['transform-class-properties', 'transform-object-assign', 'transform-object-rest-spread', 'lodash']
        }
      }
    ]
  },

  postcss: [
    require('postcss-import')({ addDependencyTo: webpack }),
    require('postcss-cssnext')
  ],

  plugins: [
    new ExtractTextPlugin('cms.css', { allChunks: true }),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ],

  context: path.join(__dirname, 'src'),
  entry: {
    cms: './index',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  externals:  [/^vendor\/.+\.js$/],
  devServer: {
    contentBase: 'example/',
    historyApiFallback: true,
    devTool: 'source-map'
  },
};
