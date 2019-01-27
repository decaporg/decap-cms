const path = require('path');
const { getConfig, rules } = require('../../scripts/webpack.js');

const baseConfig = getConfig();
const corePath = path.resolve(__dirname, '../netlify-cms-core');

module.exports = {
  ...baseConfig,
  context: path.join(__dirname, 'src'),
  entry: ['./index.js'],
  module: {
    rules: [
      ...Object.entries(rules)
        .filter(([key]) => key !== 'js')
        .map(([, rule]) => rule()),
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.join(corePath, 'babel.config.js'),
          },
        },
      },
    ],
  },
  plugins: baseConfig.plugins,
};
