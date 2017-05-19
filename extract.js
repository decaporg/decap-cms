const i18n = require('i18n-extract');
const path = require('path');
const fs = require('fs');
const _ = require('lodash')
const i18nFolder = path.join(__dirname, 'src/i18n');

const keys = i18n.extractFromFiles([
  'src/**/*.js',
], {
  marker: 'polyglot.t',
});

function _mergeMissing(transls, missing) {
  _.each(missing, (i) => {
    if (transls[i.key] === undefined) {
      transls[i.key] = i.type;
    }
  });
}

// check english trans first, they MUST be complete !!!
const enFile = 'en.json';
const enFilePath = path.join(i18nFolder, enFile);
const enTransls = JSON.parse(fs.readFileSync(enFilePath));

const enMissing = i18n.findMissing(enTransls, keys);
if (enMissing.length > 0) {
  _mergeMissing(enTransls, enMissing);
  fs.writeFileSync(enFilePath, JSON.stringify(enTransls, {}, 2));
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
    _mergeMissing(transls, missing)
    fs.writeFileSync(filePath, JSON.stringify(transls, {}, 2));
    errors.push({file: file, missing: missing})
  }
});

if (errors.length > 0) {
  console.log(JSON.stringify(errors, {}, 2));
}
