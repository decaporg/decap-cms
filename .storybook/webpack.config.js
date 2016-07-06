/* global module, __dirname, require */
var webpack = require("webpack");
const path = require("path");

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
        loader: 'style!css?modules&importLoaders=1!postcss'
      },
      {
        loader: 'babel',
        test: /\.js?$/,
        exclude: /(node_modules|bower_components)/,
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015'],
          plugins: ['transform-class-properties', 'transform-object-assign', 'transform-object-rest-spread']
        }
      }
    ]
  },

  postcss: [
    require("postcss-import")({addDependencyTo: webpack}),
    require("postcss-cssnext")()
  ],
};
