const webpack = require('webpack');

module.exports = {
  plugins: [
    require('postcss-import')({ addDependencyTo: webpack }),
    require('postcss-cssnext')({
      features: {
        customProperties: {
          variables: {
            "preferred-font": 'inherit', // Override react-toolbox font setting
          },
        },
      },
    }),
  ],
};
