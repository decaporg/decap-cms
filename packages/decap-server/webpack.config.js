const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { NODE_ENV = 'production' } = process.env;

// Two thin entry points over `@decap/cli/dev`, which stays external: this package
// is a compatibility shim, the server itself ships in `@decap/cli`.
module.exports = {
  entry: { index: './src/index.js', middlewares: './src/middlewares.js' },
  mode: NODE_ENV,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  externals: [
    nodeExternals(),
    nodeExternals({ modulesDir: path.resolve(__dirname, path.join('..', '..', 'node_modules')) }),
  ],
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true, include: /^index\.js$/ }),
  ],
};
