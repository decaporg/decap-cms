const { getConfig } = require('../../scripts/webpack.js');

const baseWebpackConfig = getConfig();

module.exports = {
  ...baseWebpackConfig,
  module: {
    rules: [
      ...baseWebpackConfig.module.rules,
      {
        test: /\.css$/,
        include: [/react-datetime/],
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
};
