const webpack = require('webpack');

module.exports = {
  plugins: [
    require('postcss-import')({ addDependencyTo: webpack }),
    require('postcss-cssnext')({
      browsers: ['last 2 versions', 'IE > 10'],
    }),
  ],
};
