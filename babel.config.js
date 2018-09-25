const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const presets = () => {
  if (isTest) {
    return ['@babel/preset-react', '@babel/preset-env'];
  }
  return [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        modules: false,
        // transpile to ES5
        forceAllTransforms: true,
      },
    ],
  ];
};

const plugins = () => {
  const defaultPlugins = [
    'lodash',
    [
      'babel-plugin-transform-builtin-extend',
      {
        globals: ['Error'],
      },
    ],
    'transform-export-extensions',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-export-default-from',
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: false,
        regenerator: true,
        useESModules: !isTest,
      },
    ],
  ];

  if (isProduction) {
    return [...defaultPlugins, ['emotion', { hoist: true }]];
  }

  if (isTest) {
    return [
      ...defaultPlugins,
      [
        'inline-svg',
        {
          svgo: {
            plugins: [{ removeViewBox: false }],
          },
        },
      ],
      [
        'emotion',
        {
          sourceMap: true,
          autoLabel: true,
        },
      ],
    ];
  }

  return [
    ...defaultPlugins,
    [
      'emotion',
      {
        sourceMap: true,
        autoLabel: true,
      },
    ],
  ];
};

module.exports = {
  presets: presets(),
  plugins: plugins(),
};
