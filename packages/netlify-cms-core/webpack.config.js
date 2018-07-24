const path = require('path');
const { getConfig, rules } = require('../../scripts/webpack.js');

module.exports = {
  ...getConfig(),
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  module: {
    rules: [
      ...Object.entries(rules)
        .filter(([ key ]) => key !== 'js')
        .map(([ _, rule ]) => rule()),
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.join(__dirname, 'babel.config.js'),
          },
        },
      },
      {
        test: /\.css$/,
        include: [/redux-notifications/],
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  }
};
