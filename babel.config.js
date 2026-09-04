const path = require('path');

const appVersion = require('./packages/decap-cms-app/package.json').version;
const coreVersion = require('./packages/decap-cms-core/package.json').version;
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isESM = process.env.NODE_ENV === 'esm';

console.log('Build Package:', path.basename(process.cwd()));

// Always enabled plugins
const basePlugins = [
  'babel-plugin-inline-json-import',
  [
    '@emotion/babel-plugin',
    {
      autoLabel: 'always',
    },
  ],
];

// All legacy transforms have been removed as they are now included in @babel/preset-env
// Features like class properties, optional chaining, nullish coalescing are now standard in modern JS

const defaultPlugins = [...basePlugins];

const svgo = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
  ],
};

const slateSerializerSpec =
  /packages[\\/]decap-cms-widget-(markdown|richtext)[\\/]src[\\/]serializers[\\/]__tests__[\\/]slate\.spec\.js$/;

const automaticReactPreset = [
  '@babel/preset-react',
  {
    runtime: 'automatic',
    importSource: '@emotion/react',
  },
];

function presets() {
  return [...(!isESM ? [['@babel/preset-env', {}]] : []), '@babel/preset-typescript'];
}

function overrides() {
  return [
    {
      exclude: slateSerializerSpec,
      presets: [automaticReactPreset],
    },
    {
      test: slateSerializerSpec,
      presets: [['@babel/preset-react', { runtime: 'classic', pragma: 'h' }]],
    },
  ];
}

function plugins() {
  if (isESM) {
    return [
      ...defaultPlugins,
      [
        'transform-define',
        {
          DECAP_CMS_APP_VERSION: `${appVersion}`,
          DECAP_CMS_CORE_VERSION: `${coreVersion}`,
        },
      ],
      [
        'inline-react-svg',
        {
          svgo,
        },
      ],
      [
        'inline-import',
        {
          extensions: ['.css'],
        },
      ],
    ];
  }

  if (isTest) {
    return [
      ...defaultPlugins,
      [
        'inline-react-svg',
        {
          svgo,
        },
      ],
    ];
  }

  if (!isProduction) {
    return defaultPlugins;
  }

  return defaultPlugins;
}

module.exports = {
  presets: presets(),
  plugins: plugins(),
  overrides: overrides(),
};
