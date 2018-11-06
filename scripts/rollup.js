const path = require('path');
const pkg = require(path.join(process.cwd(), 'package.json'));
const babel = require('rollup-plugin-babel');
const reactSvg = require('rollup-plugin-react-svg');
const commonjs = require('rollup-plugin-commonjs');
const postcss = require('rollup-plugin-postcss');
const replace = require('rollup-plugin-replace');

const isProduction = process.env.NODE_ENV === 'production';

const getConfig = () => ({
  input: './src/index.js',
  output: {
    file: pkg.module,
    format: 'esm',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
      extends: require.resolve('../babel.config'),
    }),
    reactSvg(),
    commonjs(),
    postcss(),
    replace({
      NETLIFY_CMS_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
      NETLIFY_CMS_CORE_VERSION: null,
    }),
  ],
});

module.exports = {
  getConfig,
};
