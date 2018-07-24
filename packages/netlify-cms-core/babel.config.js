const babelConfig = require('../../babel.config.js');

module.exports = {
  ...babelConfig,
  plugins: [
    ...babelConfig.plugins,
    ['module-resolver', {
      root: './src/components',
      alias: {
        src: './src',
        Actions: './src/actions/',
        Constants: './src/constants/',
        Formats: './src/formats/',
        Integrations: './src/integrations/',
        Lib: './src/lib/',
        Reducers: './src/reducers/',
        Redux: './src/redux/',
        Routing: './src/routing/',
        ValueObjects: './src/valueObjects/',
      }
    }],
  ],
};
