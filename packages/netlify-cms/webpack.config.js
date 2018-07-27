const path = require('path');
const coreWebpackConfig = require('../netlify-cms-core/webpack.config.js');

module.exports = [
  {
    ...coreWebpackConfig,
    context: path.join(__dirname, 'src'),
    entry: './index.js',
  },

  /**
   * Output the same script a second time, but named `cms.js`, and with a
   * deprecation notice.
   */
  {
    ...coreWebpackConfig,
    context: path.join(__dirname, 'src'),
    entry: [
      ...coreWebpackConfig.entry,
      path.join(__dirname, 'scripts/deprecate-old-dist.js'),
    ],
    output: {
      ...coreWebpackConfig.output,
      filename: 'dist/cms.js',
    },
  },
];
