const fs = require('fs');
const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const pkg = require(path.join(process.cwd(), 'package.json'));

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
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
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin(),
  ],
  devtool: 'source-map',
  target: 'web',
  externals: (context, request, cb) => {
    const peerDeps = Object.keys(pkg.peerDependencies || {});
    const isPeerDep = dep => new RegExp(`^${dep}($|/)`).test(request);
    return peerDeps.some(isPeerDep) ? cb(null, request) : cb();
  },
  stats: {
    all: false,
  },
};
