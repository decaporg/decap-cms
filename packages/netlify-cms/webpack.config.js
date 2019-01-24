const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const pkg = require('./package.json');
const { plugins } = require('../../scripts/webpack');
const coreWebpackConfig = require('../netlify-cms-core/webpack.config.js');
const isProduction = process.env.NODE_ENV === 'production';
const { PORT = 8080, HOST = 'localhost' } = process.env;

const castArray = x => (Array.isArray(x) ? x : [x]).filter(a => a);

const addConditionalLoader = rules =>
  rules.map(rule => {
    if (!isProduction) return rule;
    if (!rule.test) return rule;
    if (!(rule.test instanceof RegExp)) return rule;
    if (!rule.test.test('.js')) return rule;
    const use = castArray(rule.use).concat('webpack-conditional-loader');
    return { ...rule, use };
  });

const baseConfig = {
  ...coreWebpackConfig,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  module: {
    ...coreWebpackConfig.module,
    rules: addConditionalLoader(coreWebpackConfig.module.rules),
  },
  plugins: [
    ...Object.entries(plugins)
      .filter(([key]) => key !== 'friendlyErrors')
      .map(([, plugin]) => plugin()),
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
      NETLIFY_CMS_CORE_VERSION: null,
    }),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [`Netlify CMS is now running at http://${HOST}:${PORT}`],
      },
    }),
  ],
  devServer: {
    contentBase: '../../dev-test',
    watchContentBase: true,
    quiet: true,
    host: HOST,
    port: PORT,
  },
  stats: {
    builtAt: false,
    chunks: false,
    colors: true,
    entrypoints: false,
    errorDetails: false,
    hash: false,
    modules: false,
    timings: false,
    version: false,
    warnings: false,
  },
};

module.exports = baseConfig;
