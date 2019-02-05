const { getConfig } = require('../../scripts/webpack.js');

const baseWebpackConfig = getConfig();

module.exports = {
  ...baseWebpackConfig,
  module: {
    rules: [
      ...baseWebpackConfig.module.rules,
      {
        test: /\.css$/,
        include: [/ol/],
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
};
