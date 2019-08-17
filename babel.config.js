const path = require('path');
const appVersion = require('./packages/netlify-cms-app/package.json').version;
const coreVersion = require('./packages/netlify-cms-core/package.json').version;
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isESM = process.env.NODE_ENV === 'esm';

console.log('Build Package:', path.basename(process.cwd()));

const presets = () => {
  return ['@babel/preset-react', '@babel/preset-env'];
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
      'emotion',
      {
        sourceMap: true,
        autoLabel: true,
      },
    ],
    [
      'module-resolver',
      isESM
        ? {
            root: ['./src'],
            alias: {
              coreSrc: './src',
              Actions: './src/actions',
              App: './src/components/App',
              Collection: './src/components/Collection',
              Constants: './src/constants',
              Editor: './src/components/Editor',
              EditorWidgets: './src/components/EditorWidgets',
              Formats: './src/formats',
              Integrations: './src/integrations',
              Lib: './src/lib',
              MediaLibrary: './src/components/MediaLibrary',
              Reducers: './src/reducers',
              ReduxStore: './src/redux',
              Routing: './src/routing',
              UI: './src/components/UI',
              Workflow: './src/components/Workflow',
              ValueObjects: './src/valueObjects',
              localforage: 'localforage',
              redux: 'redux',
            },
          }
        : {
            root: path.join(__dirname, 'packages/netlify-cms-core/src/components'),
            alias: {
              coreSrc: path.join(__dirname, 'packages/netlify-cms-core/src'),
              Actions: path.join(__dirname, 'packages/netlify-cms-core/src/actions/'),
              Constants: path.join(__dirname, 'packages/netlify-cms-core/src/constants/'),
              Formats: path.join(__dirname, 'packages/netlify-cms-core/src/formats/'),
              Integrations: path.join(__dirname, 'packages/netlify-cms-core/src/integrations/'),
              Lib: path.join(__dirname, 'packages/netlify-cms-core/src/lib/'),
              Reducers: path.join(__dirname, 'packages/netlify-cms-core/src/reducers/'),
              ReduxStore: path.join(__dirname, 'packages/netlify-cms-core/src/redux/'),
              Routing: path.join(__dirname, 'packages/netlify-cms-core/src/routing/'),
              ValueObjects: path.join(__dirname, 'packages/netlify-cms-core/src/valueObjects/'),
              localforage: 'localforage',
              redux: 'redux',
            },
          },
    ],
  ];

  if (isESM) {
    return [
      ...defaultPlugins,
      [
        'transform-define',
        {
          NETLIFY_CMS_APP_VERSION: `${appVersion}`,
          NETLIFY_CMS_CORE_VERSION: `${coreVersion}`,
        },
      ],
      [
        'inline-svg',
        {
          svgo: {
            plugins: [{ removeViewBox: false }],
          },
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
    ];
  }

  if (!isProduction) {
    defaultPlugins.push('react-hot-loader/babel');
  }

  return defaultPlugins;
};

module.exports = {
  presets: presets(),
  plugins: plugins(),
};
