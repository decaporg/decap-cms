const path = require('path');

const appVersion = require('./packages/decap-cms-app/package.json').version;
const coreVersion = require('./packages/decap-cms-core/package.json').version;
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isESM = process.env.NODE_ENV === 'esm';

console.log('Build Package:', path.basename(process.cwd()));

// Always enabled plugins
const basePlugins = ['babel-plugin-inline-json-import'];

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

function presets() {
  return [
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        importSource: '@emotion/react',
      },
    ],
    ...(!isESM ? [['@babel/preset-env', {}]] : []),
    '@babel/preset-typescript',
  ];
}

function plugins() {
  if (isESM) {
    return [
      ...defaultPlugins,
      '@emotion/babel-plugin',
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
      '@emotion/babel-plugin',
      [
        'inline-react-svg',
        {
          svgo,
        },
      ],
    ];
  }

  if (!isProduction) {
    return [...defaultPlugins, '@emotion/babel-plugin'];
  }

  return [...defaultPlugins, '@emotion/babel-plugin'];
}

module.exports = {
  presets: presets(),
  plugins: plugins(),
  overrides: [
    {
      test: /slate\.spec\.js$/,
      presets: [
        [
          '@babel/preset-react',
          {
            runtime: 'classic',
            pragma: 'h',
          },
        ],
        ...(!isESM ? [['@babel/preset-env', {}]] : []),
        '@babel/preset-typescript',
      ],
    },
  ],
};
