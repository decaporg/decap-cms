const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin');
const { flatMap } = require('lodash');

const { toGlobalName, externals } = require('./externals');
const pkg = require(path.join(process.cwd(), 'package.json'));

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function moduleNameToPath(libName) {
  return path.resolve(__dirname, '..', 'node_modules', libName);
}

function rules() {
  return {
    js: () => ({
      test: /\.(ts|js)x?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          rootMode: 'upward',
        },
      },
    }),
    css: () => [
      {
        test: /\.css$/,
        include: ['ol', 'react-toastify', 'codemirror'].map(moduleNameToPath),
        use: ['to-string-loader', 'css-loader'],
      },
    ],
    svg: () => ({
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      exclude: [/node_modules/],
      use: 'svg-inline-loader',
    }),
    vfile: () => ({
      test: /node_modules\/vfile\/core\.js/,
      use: [
        {
          loader: 'imports-loader',
          options: {
            type: 'commonjs',
            imports: ['single process/browser process'],
          },
        },
      ],
    }),
  };
}

function plugins() {
  return {
    ignoreEsprima: () =>
      new webpack.IgnorePlugin({ resourceRegExp: /^esprima$/, contextRegExp: /js-yaml/ }),
    friendlyErrors: () => new FriendlyErrorsWebpackPlugin(),
    buffer: () =>
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
  };
}

function stats() {
  if (isProduction) {
    return {
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
    };
  }
  return {
    all: false,
  };
}

const umdPath = path.resolve(process.cwd(), 'dist');
const umdDirPath = path.resolve(process.cwd(), 'dist/umd');
const cjsPath = path.resolve(process.cwd(), 'dist/cjs');

function targetOutputs() {
  console.log(`Building [${pkg.name}, library: ${toGlobalName(pkg.name)}]`);
  return {
    umd: {
      path: umdPath,
      filename: `${pkg.name}.js`,
      library: toGlobalName(pkg.name),
      libraryTarget: 'umd',
      libraryExport: toGlobalName(pkg.name),
      umdNamedDefine: true,
      globalObject: 'window',
    },
    umddir: {
      path: umdDirPath,
      filename: `index.js`,
      library: toGlobalName(pkg.name),
      libraryTarget: 'umd',
      libraryExport: toGlobalName(pkg.name),
      umdNamedDefine: true,
      globalObject: 'window',
    },
    cjs: {
      path: cjsPath,
      filename: 'index.js',
      library: toGlobalName(pkg.name),
      libraryTarget: 'window',
    },
  };
}

const umdExternals = Object.keys(pkg.peerDependencies || {}).reduce((previous, key) => {
  if (!externals[key]) throw `Missing external [${key}]`;
  previous[key] = externals[key] || null;
  return previous;
}, {});

/**
 * Use [getConfig({ target:'umd' }), getConfig({ target:'cjs' })] for
 *  getting multiple configs and add the new output in targetOutputs if needed.
 * Default: umd
 */
function baseConfig({ target = isProduction ? 'umd' : 'umddir' } = {}) {
  return {
    context: process.cwd(),
    mode: isProduction ? 'production' : 'development',
    entry: './src',
    output: targetOutputs()[target],
    module: {
      rules: flatMap(Object.values(rules()), rule => rule()),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      fallback: {
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      },
    },
    plugins: Object.values(plugins()).map(plugin => plugin()),
    devtool: isTest ? '' : 'source-map',
    target: 'web',

    /**
     * Exclude peer dependencies from package bundles.
     */
    externals:
      target.slice(0, 3) === 'umd'
        ? umdExternals
        : (context, request, cb) => {
            const externals = Object.keys(pkg.peerDependencies || {});

            function isPeerDep(dep) {
              return new RegExp(`^${dep}($|/)`).test(request);
            }

            return externals.some(isPeerDep) ? cb(null, request) : cb();
          },
    stats: stats(),
  };
}

function getConfig({ baseOnly = false } = {}) {
  if (baseOnly) {
    // decap-cms build
    return baseConfig({ target: 'umd' });
  }
  return [baseConfig({ target: 'umd' })];
}

module.exports = {
  getConfig,
  rules: rules(),
  plugins: plugins(),
};
