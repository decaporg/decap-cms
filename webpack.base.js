/* eslint global-require: 0 */

const webpack = require('webpack');

module.exports = {
  module: {
    loaders: [
      {
        test: /\.(png|eot|woff|woff2|ttf|svg|gif)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=100000',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.scss$/,
        loader: 'style!css?modules!sass',
      },
      {
        test: /\.css$/,
        loader: 'style!css?modules&importLoaders=1&&localIdentName=cms__[name]__[local]!postcss',
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
            'react-hot-loader/babel',
          ],
        },
      },
    ],
  },
  postcss: [
    require('postcss-import')({ addDependencyTo: webpack }),
    require('postcss-cssnext'),
  ],
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
  ],
};
