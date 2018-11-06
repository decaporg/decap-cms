const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const pkg = require(path.join(process.cwd(), 'package.json'));

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  mode: isProduction ? 'production' : 'development',
  context: path.join(__dirname, 'dist'),
  entry: './netlify-cms.esm.js',
  output: {
    path: process.cwd(),
    filename: pkg.main,
    library: pkg.name,
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  devtool: 'source-map',
  target: 'web',
  module: {
    rules: [
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
  /**
   * Exclude peer dependencies from package bundles.
   */
  externals: (context, request, cb) => {
    const localExternals = pkg.localExternals || [];
    const peerDeps = Object.keys(pkg.peerDependencies || {});
    const externals = isProduction ? peerDeps : [...localExternals, ...peerDeps];
    const isPeerDep = dep => new RegExp(`^${dep}($|/)`).test(request);
    return externals.some(isPeerDep) ? cb(null, request) : cb();
  },
  stats: isProduction
    ? {
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
      }
    : {
        all: false,
      },
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
