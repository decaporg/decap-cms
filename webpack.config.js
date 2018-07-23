const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const pkg = require(path.join(process.cwd(), 'package.json'));

const isProduction = process.env.NODE_ENV === 'production';

const plugins = () => {
  const defaultPlugins = [
    new FriendlyErrorsWebpackPlugin(),
  ];

  if (isProduction) {
    return [
      ...defaultPlugins,
      new webpack.SourceMapDevToolPlugin({
        filename: '[file].map',
        moduleFilenameTemplate: info => path.posix.normalize(`../src/${info.resourcePath}`),
        noSources: true,
      }),
    ];
  }

  return [
    ...defaultPlugins,
  ];
};

const stats = () => {
  if (isProduction) {
    return {
      builtAt: false,
      colors: true,
      entrypoints: false,
      hash: false,
      modules: false,
      timings: false,
      version: false,
    };
  }
  return {
    all: false,
  };
};

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    path: process.cwd(),
    filename: pkg.main,
    library: pkg.name,
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.join(__dirname, 'babel.config.js'),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        exclude: [/node_modules/],
        loader: 'svg-inline-loader',
      },
    ],
  },
  plugins: plugins(),
  devtool: !isProduction && 'source-map',
  target: 'web',
  /**
   * Exclude peer dependencies from package bundles.
   */
  externals: (context, request, cb) => {
    const peerDeps = Object.keys(pkg.peerDependencies || {});
    const isPeerDep = dep => new RegExp(`^${dep}($|/)`).test(request);
    return peerDeps.some(isPeerDep) ? cb(null, request) : cb();
  },
  stats: stats(),
};
