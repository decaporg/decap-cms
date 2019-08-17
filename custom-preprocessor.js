const babelJest = require('babel-jest');
const babelConfig = require('./babel.config.js');

module.exports = babelJest.createTransformer(babelConfig);
