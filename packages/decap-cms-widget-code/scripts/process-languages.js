const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const uniq = require('lodash/uniq');

const rawDataPath = '../data/languages-raw.yml';
const outputPath = '../data/languages.json';
const loaderPath = '../src/languageLoaders.js';

async function fetchData() {
  const filePath = path.resolve(__dirname, rawDataPath);
  const fileContent = await fs.readFile(filePath);
  return yaml.parse(fileContent);
}

function outputData(data) {
  const filePath = path.resolve(__dirname, outputPath);
  return fs.writeJson(filePath, data);
}

function generateLoaders(transformedData) {
  // Extract all unique modes
  const modes = new Set();
  transformedData.forEach(lang => {
    if (lang.codemirror_mode) {
      modes.add(lang.codemirror_mode);
    }
  });

  // Generate loader functions for each mode
  let fileContent = `// Generated file - DO NOT EDIT
// This file contains dynamic loader functions for CodeMirror modes

const loaders = {
`;

  // Create loader functions
  Array.from(modes)
    .sort()
    .forEach(mode => {
      fileContent += `  '${mode}': () => import('codemirror/mode/${mode}/${mode}.js'),
`;
    });

  fileContent += `};

// Get a loader for a specific mode
export function getLanguageLoader(mode) {
  return loaders[mode] || null;
}

export default loaders;
`;

  const filePath = path.resolve(__dirname, loaderPath);
  return fs.writeFile(filePath, fileContent);
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
  await outputData(transformedData);
  await generateLoaders(transformedData);

  console.log('Generated language data and loaders');
}

process();
