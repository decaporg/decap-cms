module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:cypress/recommended',
    'prettier/react',
    'prettier/babel',
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
    'emotion/no-vanilla': 'error',
    'emotion/import-from-emotion': 'error',
    'emotion/styled-import': 'error',
  },
  plugins: ['babel', 'emotion', 'cypress'],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
