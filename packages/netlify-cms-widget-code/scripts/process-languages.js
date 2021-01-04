const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const uniq = require('lodash/uniq');

const rawDataPath = '../data/languages-raw.yml';
const outputPath = '../data/languages.json';

async function fetchData() {
  const filePath = path.resolve(__dirname, rawDataPath);
  const fileContent = await fs.readFile(filePath);
  return yaml.load(fileContent);
}

function outputData(data) {
  const filePath = path.resolve(__dirname, outputPath);
  return fs.writeJson(filePath, data);
}

function transform(data) {
  return Object.entries(data).reduce((acc, [label, lang]) => {
    const { extensions = [], aliases = [], codemirror_mode, codemirror_mime_type } = lang;
    if (codemirror_mode) {
      const dotlessExtensions = extensions.map(ext => ext.slice(1));
      const identifiers = uniq(
        [label.toLowerCase(), ...aliases, ...dotlessExtensions].filter(alias => {
          if (!alias) {
            return;
          }
          return !/[^a-zA-Z]/.test(alias);
        }),
      );
      acc.push({ label, identifiers, codemirror_mode, codemirror_mime_type });
    }
    return acc;
  }, []);
}

async function process() {
  const data = await fetchData();
  const transformedData = transform(data);
  return outputData(transformedData);
}

process();
