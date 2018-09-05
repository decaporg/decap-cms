const path = require('path');
const babelConfig = require('../../babel.config.js');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  ...babelConfig,
  plugins: [
    ...babelConfig.plugins,
    isProduction ? null : 'react-hot-loader/babel',
    [
      'module-resolver',
      {
        root: path.join(__dirname, 'src/components'),
        alias: {
          src: path.join(__dirname, 'src'),
          Actions: path.join(__dirname, 'src/actions/'),
          Constants: path.join(__dirname, 'src/constants/'),
          Formats: path.join(__dirname, 'src/formats/'),
          Integrations: path.join(__dirname, 'src/integrations/'),
          Lib: path.join(__dirname, 'src/lib/'),
          Reducers: path.join(__dirname, 'src/reducers/'),
          Redux: path.join(__dirname, 'src/redux/'),
          Routing: path.join(__dirname, 'src/routing/'),
          ValueObjects: path.join(__dirname, 'src/valueObjects/'),
        },
      },
    ],
  ].filter(item => item),
};
