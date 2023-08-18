const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { NODE_ENV = 'production' } = process.env;

const allowlist = [/^decap-cms-lib-util/];

module.exports = {
  entry: { index: path.join('src', 'index.ts'), middlewares: path.join('src', 'middlewares.ts') },
  mode: NODE_ENV,
  target: 'node',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
      },
    ],
  },
  externals: [
    nodeExternals({ allowlist }),
    nodeExternals({
      allowlist,
      modulesDir: path.resolve(__dirname, path.join('..', '..', 'node_modules')),
    }),
  ],
  plugins: [new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })],
};
