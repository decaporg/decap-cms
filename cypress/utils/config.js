const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const devTestDirectory = path.join(__dirname, '..', '..', 'dev-test');
const backendsDirectory = path.join(devTestDirectory, 'backends');

async function copyBackendFiles(backend) {
  await Promise.all(
    ['config.yml', 'index.html'].map(file => {
      return fs.copyFile(
        path.join(backendsDirectory, backend, file),
        path.join(devTestDirectory, file),
      );
    }),
  );
}

async function updateConfig(configModifier) {
  const configFile = path.join(devTestDirectory, 'config.yml');
  const configContent = await fs.readFile(configFile);
  const config = yaml.safeLoad(configContent);
  await configModifier(config);
  await fs.writeFileSync(configFile, yaml.safeDump(config));
}

module.exports = { copyBackendFiles, updateConfig };
