module.exports = {
  presets: [
    '@babel/preset-react',
    ['@babel/preset-env', {
      modules: false,
    }],
  ],
  plugins: [
    'lodash',
    ['babel-plugin-transform-builtin-extend', {
      globals: ['Error']
    }],
    ['module-resolver', {
      root: [
        './src/components'
      ],
      alias: {
        Actions: './src/actions/',
        Backends: './src/backends/',
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
    'transform-export-extensions',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-export-default-from',
  ],
  env: {
    production: {
      plugins: [
        ['emotion', { hoist: true }],
      ],
    },
    development: {
      plugins: [
        ['emotion', {
          sourceMap: true,
          autoLabel: true,
        }],
      ],
    },
  },
};
