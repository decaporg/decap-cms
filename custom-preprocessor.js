const babelJest = require('babel-jest');
const babelConfig = require('./packages/netlify-cms-core/babel.config.js');

module.exports = babelJest.createTransformer(babelConfig);
