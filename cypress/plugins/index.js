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
const { prepareTestGitHubRepo, deleteRepository, getUser, resetRepository } = require('./github');

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

async function updateConfig(configModifier) {
  const configFile = path.join(devTestDirectory, 'config.yml');
  const configContent = await fs.readFile(configFile);
  const config = yaml.safeLoad(configContent);
  await configModifier(config);
  await fs.writeFileSync(configFile, yaml.safeDump(config));
}

async function setupGitHub() {
  const [user, repoData] = await Promise.all([getUser(), prepareTestGitHubRepo()]);

  await updateConfig(config => {
    config.backend.repo = `${repoData.owner}/${repoData.repo}`;
  });

  return { ...repoData, user };
}

async function teardownGitHub(taskData) {
  await deleteRepository(taskData);
  return null;
}

async function teardownBackendTest(taskData) {
  await resetRepository(taskData);
  return null;
}

module.exports = async on => {
  // `on` is used to hook into various events Cypress emits
  on('task', {
    async setupBackend({ backend }) {
      console.log('Preparing environment for backend', backend);
      await copyBackendFiles(backend);

      if (backend === 'github') {
        return await setupGitHub();
      }

      return null;
    },
    async teardownBackend(taskData) {
      const { backend } = taskData;
      console.log('Tearing down backend', backend);
      if (backend === 'github') {
        return await teardownGitHub(taskData);
      }

      return null;
    },
    async teardownBackendTest(taskData) {
      const { backend } = taskData;
      console.log('Tearing down single test for backend', backend);
      if (backend === 'github') {
        return await teardownBackendTest(taskData);
      }
    },
    async restoreDefaults() {
      console.log('Restoring defaults');
      await copyBackendFiles('test');

      return null;
    },
  });
};
