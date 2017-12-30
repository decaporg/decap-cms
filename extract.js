const i18n = require('i18n-extract');
const path = require('path');
const fs = require('fs');
const _ = require('lodash').mixin(require('lodash-keyarrange'))
const i18nFolder = path.join(__dirname, 'src/i18n');

const keys = i18n.extractFromFiles([
  'src/**/*.js',
], {
  marker: 'i18n.t',
});

function mergeMissing(translations, missing, makeVal) {
  _.each(missing, (i) => {
    if (translations[i.key] === undefined) {
      translations[i.key] = makeVal(i);
    }
  });
}

function writeTranslations(file, translations) {
  const sorted = _.keyArrange(translations)
  fs.writeFileSync(file, JSON.stringify(sorted, {}, 2));
}

// check english trans first, they MUST be complete !!!
const enFile = 'en.json';
const enFilePath = path.join(i18nFolder, enFile);
const enTransls = JSON.parse(fs.readFileSync(enFilePath));

const enMissing = i18n.findMissing(enTransls, keys);
if (enMissing.length > 0) {
  mergeMissing(enTransls, enMissing, (i) => i.type);
  writeTranslations(enFilePath, enTransls);
  console.log('Some errors in english translation. Correct them:');
  console.log(JSON.stringify(enMissing, {}, 2));
  return -1;
}

const errors = []

fs.readdirSync(i18nFolder).forEach(file => {
  if (file === enFile || file === 'index.js') {
    return
  }
  const filePath = path.join(i18nFolder, file);
  console.log(filePath);
  const translations = JSON.parse(fs.readFileSync(filePath));

  const missing = i18n.findMissing(translations, keys);
  if (missing.length > 0) {
    mergeMissing(translations, missing, (i) => enTransls[i.key])
    writeTranslations(filePath, translations);
    errors.push({file: file, missing: missing})
  }
});

if (errors.length > 0) {
  console.log(JSON.stringify(errors, {}, 2));
}
