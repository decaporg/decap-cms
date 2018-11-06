const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const pkg = require('./package.json');
const { getConfig, rules } = require('../../scripts/webpack.js');

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  ...getConfig(),
  context: path.join(__dirname, 'dist'),
  entry: './netlify-cms.esm.js',
  module: {
    rules: [
      ...Object.entries(rules)
        .filter(([key]) => key !== 'js')
        .map(([, rule]) => rule()),
      {
        test: /\.css$/,
        include: [/(redux-notifications|react-datetime)/],
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['Netlify CMS is now running at http://localhost:8080'],
      },
    }),
    new CopyWebpackPlugin([{ from: '../shims/cms.css', to: 'dist/' }]),
  ],
  devServer: {
    contentBase: '../../dev-test',
    watchContentBase: true,
    quiet: true,
    host: 'localhost',
    port: 8080,
  },
};

if (isProduction) {
  module.exports = [
    baseConfig,

    /**
     * Output the same script a second time, but named `cms.js`, and with a
     * deprecation notice.
     */
    {
      ...baseConfig,
      entry: [path.join(__dirname, 'shims/deprecate-old-dist.js'), baseConfig.entry],
      output: {
        ...baseConfig.output,
        filename: 'dist/cms.js',
      },
    },
  ];
} else {
  module.exports = baseConfig;
}
