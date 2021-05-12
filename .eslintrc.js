module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:cypress/recommended',
    'prettier',
  ],
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true,
    'cypress/globals': true,
  },
  globals: {
    NETLIFY_CMS_VERSION: false,
    NETLIFY_CMS_APP_VERSION: false,
    NETLIFY_CMS_CORE_VERSION: false,
    CMS_ENV: false,
  },
  rules: {
    'no-console': [0],
    'react/prop-types': [0],
    'no-duplicate-imports': 'error',
    '@emotion/no-vanilla': 'error',
    '@emotion/import-from-emotion': 'error',
    '@emotion/styled-import': 'error',
    'require-atomic-updates': [0],
    'object-shorthand': ['error', 'always'],
    'func-style': ['error', 'declaration'],
    'prefer-const': [
      'error',
      {
        destructuring: 'all',
      },
    ],
  },
  plugins: ['babel', '@emotion', 'cypress'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:cypress/recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
      ],
      plugins: ['eslint-plugin-import-helpers'],
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'no-duplicate-imports': [0], // handled by @typescript-eslint
        'require-atomic-updates': [0],
        'import-helpers/order-imports': [
          'error',
          {
            newlinesBetween: 'always',
            groups: [['module'], ['parent', 'sibling', 'index']],
          },
        ],
        'import/no-unresolved': [
          'error',
          {
            ignore: [
              'netlify-cms-lib-util',
              'netlify-cms-lib-widgets',
              'netlify-cms-backend-github',
              'netlify-cms-backend-gitlab',
              'netlify-cms-backend-bitbucket',
            ],
          },
        ],
        '@typescript-eslint/ban-types': [0], // TODO enable in future
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-non-null-assertion': [0],
        '@typescript-eslint/explicit-module-boundary-types': [0],
        '@typescript-eslint/explicit-function-return-type': [0],
        '@typescript-eslint/no-use-before-define': [
          'error',
          { functions: false, classes: true, variables: true },
        ],
      },
    },
  ],
};
