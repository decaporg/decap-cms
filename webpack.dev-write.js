/* global require */
const merge = require('webpack-merge');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = merge.smart(require('./webpack.dev.js'), {
  serve: {
    dev: {
      writeToDisk: true,
    },
  },
});
