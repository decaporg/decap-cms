const webpack = require('webpack');

const pkg = require('./package.json');
const { getConfig } = require('../../scripts/webpack.js');

const isProduction = process.env.NODE_ENV === 'production';

const versionPlugin = new webpack.DefinePlugin({
  NETLIFY_CMS_CORE_VERSION: JSON.stringify(`${pkg.version}${isProduction ? '' : '-dev'}`),
});

function configs() {
  return getConfig().map(config => {
    return {
      ...config,
      plugins: [...config.plugins, versionPlugin],
    };
  });
}

module.exports = configs();
