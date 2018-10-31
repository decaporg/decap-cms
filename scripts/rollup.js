const path = require('path');
const pkg = require(path.join(process.cwd(), 'package.json'));
const babel = require('rollup-plugin-babel');
const reactSvg = require('rollup-plugin-react-svg');
const commonjs = require('rollup-plugin-commonjs');
const postcss = require('rollup-plugin-postcss');

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
  ],
});

module.exports = {
  getConfig,
};
