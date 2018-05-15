const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const pkg = require('./package.json');

function getPlugins(env, argv) {
  const plugins = [
    new webpack.IgnorePlugin(/^esprima$/, /js-yaml/), // Ignore Esprima import for js-yaml
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // Ignore all optional deps of moment.js
    new webpack.DefinePlugin({
      NETLIFY_CMS_VERSION: JSON.stringify(
        `${pkg.version}${env.production ? '' : '-dev'}`
      ),
    }),
    new webpack.NoEmitOnErrorsPlugin(), // Default for production mode, but adding to development mode
  ];
  if (env.production) {
    // Extract CSS
    plugins.push(
      new MiniCssExtractPlugin({
        filename: '[name].css',
      })
    );
    // During beta phase, generate source maps for better errors
    plugins.push(
      new webpack.SourceMapDevToolPlugin({
        // asset matching
        test: /\.js?$/,

        // file and reference
        filename: '[file].map',

        // don't include source file content, since we link to the actual file
        noSources: true,

        // sourcemap is in 'dist', webpack context is in 'src'
        moduleFilenameTemplate: info =>
          path.posix.normalize(`../src/${info.resourcePath}`),
      })
    );
  }
  if (env.development) {
    plugins.push(new webpack.HotModuleReplacementPlugin());
    
    if (env.write) {
      plugins.push(new WriteFilePlugin());
    }
  }
  return plugins;
}

module.exports = function(env, argv) {
  const plugins = getPlugins(env, argv);

  return {
    mode: env.production ? 'production' : 'development',
    entry: {
      cms: './index',
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
      library: 'netlify-cms',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
    context: path.join(__dirname, 'src'),
    module: {
      noParse: /localforage\.js/,
      rules: [
        {
          test: /\.js?$/,
          use: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          /**
           * CSS loader for npm modules that are shipped with CSS that should be loaded without processing.
           * List all of theme in the array
           */
          test: /\.css$/,
          include: [/redux-notifications/],
          use: [
            env.production ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        {
          /* We use PostCSS for CMS styles */
          test: /\.css$/,
          exclude: [/node_modules/],
          use: [
            env.production ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            { loader: 'postcss-loader' },
          ],
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          exclude: [/node_modules/],
          loader: 'svg-inline-loader',
        },
      ],
    },
    plugins,
    target: 'web', // Make web variables accessible to webpack, e.g. window
    devServer: {
      contentBase: 'example/',
      hot: true,
    },
  };
};
