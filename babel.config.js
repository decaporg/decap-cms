const path = require('path');
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
      'module-resolver',
      {
        root: path.join(__dirname, 'packages/netlify-cms-core/src/components'),
        alias: {
          coreSrc: path.join(__dirname, 'packages/netlify-cms-core/src'),
          Actions: path.join(__dirname, 'packages/netlify-cms-core/src/actions/'),
          Constants: path.join(__dirname, 'packages/netlify-cms-core/src/constants/'),
          Formats: path.join(__dirname, 'packages/netlify-cms-core/src/formats/'),
          Integrations: path.join(__dirname, 'packages/netlify-cms-core/src/integrations/'),
          Lib: path.join(__dirname, 'packages/netlify-cms-core/src/lib/'),
          Reducers: path.join(__dirname, 'packages/netlify-cms-core/src/reducers/'),
          Redux: path.join(__dirname, 'packages/netlify-cms-core/src/redux/'),
          Routing: path.join(__dirname, 'packages/netlify-cms-core/src/routing/'),
          ValueObjects: path.join(__dirname, 'packages/netlify-cms-core/src/valueObjects/'),
        },
      },
    ],
  ];

  if (isProduction) {
    return [
      ...defaultPlugins,
      [
        'emotion',
        {
          hoist: true,
          autoLabel: true,
        },
      ],
    ];
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

  defaultPlugins.push('react-hot-loader/babel');
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
