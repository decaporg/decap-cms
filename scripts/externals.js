const fs = require('fs');
const path = require('path');

/**
 * Takes a dash [-] separated name and makes it camel-cased
 * netlify-cms-something to NetlifyCmsSomething
 * @param {} string
 */
const toGlobalName = name =>
  `${name}`
    .replace(new RegExp(/[-_/]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w+)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`,
    )
    .replace(new RegExp(/\s/, 'g'), '')
    .replace(new RegExp(/\w/), s => s.toUpperCase());

const packages = fs.readdirSync(path.resolve(__dirname, '../packages'));

const packageExports = {};
packages.map(name => {
  packageExports[name] = {
    root: `${toGlobalName(name)}`.split('.'),
    commonjs2: name,
    commonjs: name,
    amd: name,
    umd: name,
  };
});

module.exports = {
  toGlobalName,
  externals: {
    ...packageExports,
    lodash: {
      root: ['NetlifyCmsDefaultExports', 'Lodash'],
      commonjs2: 'lodash',
      commonjs: 'lodash',
      amd: 'lodash',
      umd: 'lodash',
    },
    '@emotion/core': {
      root: ['NetlifyCmsDefaultExports', 'EmotionCore'],
      commonjs2: '@emotion/core',
      commonjs: '@emotion/core',
      amd: '@emotion/core',
      umd: '@emotion/core',
    },
    '@emotion/styled': {
      root: ['NetlifyCmsDefaultExports', 'EmotionStyled'],
      commonjs2: '@emotion/styled',
      commonjs: '@emotion/styled',
      amd: '@emotion/styled',
      umd: '@emotion/styled',
    },
    codemirror: {
      root: 'CodeMirror',
      commonjs2: 'codemirror',
      commonjs: 'codemirror',
      amd: 'codemirror',
      umd: 'codemirror',
    },
    immutable: {
      root: ['NetlifyCmsDefaultExports', 'Immutable'],
      commonjs2: 'immutable',
      commonjs: 'immutable',
      amd: 'immutable',
      umd: 'immutable',
    },
    moment: {
      root: ['NetlifyCmsDefaultExports', 'Moment'],
      commonjs2: 'moment',
      commonjs: 'moment',
      amd: 'moment',
      umd: 'moment',
    },
    'prop-types': {
      root: ['NetlifyCmsDefaultExports', 'PropTypes'],
      commonjs2: 'prop-types',
      commonjs: 'prop-types',
      amd: 'prop-types',
      umd: 'prop-types',
    },
    'react-immutable-proptypes': {
      root: ['NetlifyCmsDefaultExports', 'ImmutablePropTypes'],
      commonjs2: 'react-immutable-proptypes',
      commonjs: 'react-immutable-proptypes',
      amd: 'react-immutable-proptypes',
      umd: 'react-immutable-proptypes',
    },
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
      umd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
      umd: 'react-dom',
    },
    uuid: {
      root: ['NetlifyCmsDefaultExports', 'UUId'],
      commonjs2: 'uuid',
      commonjs: 'uuid',
      amd: 'uuid',
      umd: 'uuid',
    },
  },
};
