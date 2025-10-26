const {
  dirname,
  join
} = require("node:path");

module.exports = {
  stories: [
    '../packages/decap-cms-core/src/**/*.stories.js',
    '../packages/decap-cms-ui-default/src/**/*.stories.js',
  ],
  addons: [getAbsolutePath("@storybook/addon-links")],
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
