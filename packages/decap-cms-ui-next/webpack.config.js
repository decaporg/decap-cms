const { getConfig } = require('../../scripts/webpack.js');

function configs() {
  return getConfig().map(config => {
    return {
      ...config,
      rules: [
        ...config.rules,
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          use: ['file-loader'],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    };
  });
}

module.exports = configs();
