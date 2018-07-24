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
