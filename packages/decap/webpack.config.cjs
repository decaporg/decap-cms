const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const { version } = require('./package.json');
const { NODE_ENV = 'production' } = process.env;

// Workspace packages are bundled in: the API contract, so the published CLI
// cannot drift from the version it was built against, and the few
// decap-cms-lib-util helpers the dev server uses. Everything else in
// node_modules stays external and is installed as a dependency.
const allowlist = [/^decap-turbo-api/, /^decap-cms-lib-util/];

module.exports = {
  entry: {
    // The `decap` binary.
    cli: path.join('src', 'index.ts'),
    // `@decap/cli/dev`: the proxy server's programmatic API (registerLocalFs,
    // registerLocalGit, runDevServer), which decap-server re-exports.
    dev: path.join('src', 'dev', 'index.ts'),
  },
  mode: NODE_ENV,
  target: 'node',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    // .cjs: the package is "type": "module", so a .js bundle would be loaded
    // as ESM. The bundle is CommonJS so its externals resolve to the MCP SDK's
    // CommonJS build.
    filename: '[name].cjs',
    chunkFilename: 'chunks/[name].cjs',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.ts', '.js'],
    // Sources are ESM and import siblings as `./api.js`, which TypeScript's
    // node16 resolution requires; map those back to the .ts files.
    extensionAlias: { '.js': ['.ts', '.js'] },
  },
  module: {
    rules: [{ test: /\.ts$/, use: ['ts-loader'] }],
  },
  externals: [
    nodeExternals({ allowlist }),
    nodeExternals({
      allowlist,
      modulesDir: path.resolve(__dirname, path.join('..', '..', 'node_modules')),
    }),
  ],
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true, include: /^cli\.cjs$/ }),
    new webpack.DefinePlugin({ DECAP_CLI_VERSION: JSON.stringify(version) }),
  ],
};
