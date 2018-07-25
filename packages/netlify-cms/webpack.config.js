const path = require('path');
const coreWebpackConfig = require('../netlify-cms-core/webpack.config.js');

module.exports = {
  ...coreWebpackConfig,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
};
