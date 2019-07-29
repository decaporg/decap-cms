// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { prepareTestGitHubRepo, deleteRepository } = require('./github');

const devTestDirectory = path.join(__dirname, '..', '..', 'dev-test');
const backendsDirectory = path.join(devTestDirectory, 'backends');

async function copyBackendFiles(backend) {
  for (let file of ['config.yml', 'index.html']) {
    await fs.copyFile(
      path.join(backendsDirectory, backend, file),
      path.join(devTestDirectory, file),
    );
  }
}

async function setupGitHub() {
  const { owner, repo } = await prepareTestGitHubRepo();

  const configFile = path.join(devTestDirectory, 'config.yml');
  const configContent = await fs.readFile(configFile);
  const config = yaml.safeLoad(configContent);
  config.backend.repo = `${owner}/${repo}`;

  await fs.writeFileSync(configFile, yaml.safeDump(config));

  return { owner, repo };
}

async function teardownGitHub({ owner, repo }) {
  await deleteRepository({
    owner,
    repo,
  });
}

module.exports = async on => {
  // `on` is used to hook into various events Cypress emits
  on('task', {
    async setupBackend({ backend }) {
      console.log('Preparing environment for backend', backend);
      await copyBackendFiles(backend);

      if (backend === 'github') {
        const result = await setupGitHub();
        return result;
      }

      return null;
    },
    async teardownBackend(taskData) {
      console.log('Tearing down backend', backend);
      const { backend } = taskData;
      if (backend === 'github') {
        const { owner, repo } = taskData;
        await teardownGitHub({ owner, repo });
      }

      return null;
    },
    async restoreDefaults() {
      console.log('Restoring defaults');
      await copyBackendFiles('test');

      return null;
    },
  });
};
