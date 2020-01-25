const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { NODE_ENV = 'production' } = process.env;

const allowList = [/^netlify-cms-lib-util/];

module.exports = {
  entry: path.join('src', 'index.ts'),
  mode: NODE_ENV,
  target: 'node',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
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
    nodeExternals({ whitelist: allowList }),
    nodeExternals({
      whitelist: allowList,
      modulesDir: path.resolve(__dirname, path.join('..', '..', 'node_modules')),
    }),
  ],
  plugins: [new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })],
};
