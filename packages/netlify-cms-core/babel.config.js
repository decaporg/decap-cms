const babelConfig = require('../../babel.config.js');

module.exports = {
  ...babelConfig,
  plugins: [
    ...babelConfig.plugins,
    'react-hot-loader/babel',
  ],
};
