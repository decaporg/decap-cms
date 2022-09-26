const fs = require('fs');
const path = require('path');

/**
 * Takes a dash [-] separated name and makes it camel-cased
 * netlify-cms-something to NetlifyCmsSomething
 * @param {} string
 */
function toGlobalName(name) {
  return `${name}`
    .replace(new RegExp(/[-_/]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w+)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`,
    )
    .replace(new RegExp(/\s/, 'g'), '')
    .replace(new RegExp(/\w/), s => s.toUpperCase());
}

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
};
