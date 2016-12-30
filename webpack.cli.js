/* global module, __dirname, require */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');

module.exports = merge.smart(require('./webpack.base.js'), {
  plugins: [
    new webpack.BannerPlugin('#!/usr/bin/env node', { raw: true }),
  ],
  entry: {
    "autoconfigure.collection": './scripts/autoconfigure.collection',
  },
  output: {
    path: path.join(__dirname, 'bin'),
    filename: '[name].js',
  },
  externals: {
    fs: 'commonjs fs',
    path: 'commonjs path',
    process: 'commonjs process',
  },
});
