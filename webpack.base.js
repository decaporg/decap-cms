/* eslint global-require: 0 */

const webpack = require('webpack');
const path = require('path');
const { partial } = require('lodash');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const resolveAlias = partial(path.resolve, __dirname);
const componentsDir = 'src/components';

module.exports = {
  /**
   * Use aliases to avoid relative path import hell.
   */
  resolve: {
    alias: {
      /**
       * Components
       */
      App: resolveAlias(`${componentsDir}/App/`),
      Collection: resolveAlias(`${componentsDir}/Collection/`),
      Editor: resolveAlias(`${componentsDir}/Editor/`),
      EditorWidgets: resolveAlias(`${componentsDir}/EditorWidgets/`),
      MarkdownPlugins: resolveAlias(`${componentsDir}/MarkdownPlugins/`),
      MediaLibrary: resolveAlias(`${componentsDir}/MediaLibrary/`),
      UI: resolveAlias(`${componentsDir}/UI/`),
      Workflow: resolveAlias(`${componentsDir}/Workflow/`),

      /**
       * Top level src directories
       */
      Actions: resolveAlias('src/actions/'),
      Backends: resolveAlias('src/backends/'),
      Constants: resolveAlias('src/constants/'),
      Formats: resolveAlias('src/formats/'),
      Integrations: resolveAlias('src/integrations/'),
      Lib: resolveAlias('src/lib/'),
      Reducers: resolveAlias('src/reducers/'),
      Redux: resolveAlias('src/redux/'),
      Routing: resolveAlias('src/routing/'),
      ValueObjects: resolveAlias('src/valueObjects/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        /* CSS loader for npm modules that are shipped with CSS that should be loaded without processing.
           List all of theme in the array
        */
        test: /\.css$/,
        include: [/redux-notifications/],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        /* We use PostCSS for CMS styles */
        test: /\.css$/,
        exclude: [/node_modules/],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            { loader: 'postcss-loader' },
          ],
        }),
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        exclude: [/node_modules/],
        loader: 'svg-inline-loader',
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin(/^esprima$/, /js-yaml/), // Ignore Esprima import for js-yaml
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // Ignore all optional deps of moment.js
  ],
  target: 'web', // Make web variables accessible to webpack, e.g. window
};
