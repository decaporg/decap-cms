const i18n = require('i18n-extract');
const path = require('path');
const fs = require('fs');
const _ = require('lodash').mixin(require('lodash-keyarrange'))
const i18nFolder = path.join(__dirname, 'src/i18n');

const keys = i18n.extractFromFiles([
  'src/**/*.js',
], {
  marker: 'polyglot.t',
});

function _mergeMissing(transls, missing, makeVal) {
  _.each(missing, (i) => {
    if (transls[i.key] === undefined) {
      transls[i.key] = makeVal(i);
    }
  });
}

function _writeTransls(file, transls) {
  const sorted = _.keyArrange(transls)
  fs.writeFileSync(file, JSON.stringify(sorted, {}, 2));
}

// check english trans first, they MUST be complete !!!
const enFile = 'en.json';
const enFilePath = path.join(i18nFolder, enFile);
const enTransls = JSON.parse(fs.readFileSync(enFilePath));

const enMissing = i18n.findMissing(enTransls, keys);
if (enMissing.length > 0) {
  _mergeMissing(enTransls, enMissing, (i) => i.type);
  _writeTransls(enFilePath, enTransls);
  console.log('Some errors in english translation. Correct them:');
  console.log(JSON.stringify(enMissing, {}, 2));
  return -1;
}

const errors = []

fs.readdirSync(i18nFolder).forEach(file => {
  if (file === enFile) {
    return
  }
  const filePath = path.join(i18nFolder, file);
  const transls = JSON.parse(fs.readFileSync(filePath));

  const missing = i18n.findMissing(transls, keys);
  if (missing.length > 0) {
    _mergeMissing(transls, missing, (i) => enTransls[i.key])
    _writeTransls(filePath, transls);
    errors.push({file: file, missing: missing})
  }
});

if (errors.length > 0) {
  console.log(JSON.stringify(errors, {}, 2));
}
