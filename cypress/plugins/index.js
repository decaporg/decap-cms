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
const {
  prepareTestGitHubRepo,
  deleteRepositories,
  getUser,
  getForkUser,
  resetRepositories,
} = require('./github');

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
  return null;
}

async function setupGitHub() {
  const [user, forkUser, repoData] = await Promise.all([
    getUser(),
    getForkUser(),
    prepareTestGitHubRepo(),
  ]);

  await updateConfig(config => {
    config.backend.repo = `${repoData.owner}/${repoData.repo}`;
  });

  return { ...repoData, user, forkUser };
}

async function teardownGitHub(taskData) {
  await deleteRepositories(taskData);
  return null;
}

async function teardownBackendTest(taskData) {
  await resetRepositories(taskData);
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
    async updateBackendOptions({ backend, options }) {
      console.log('Updating backend', backend, 'with options', options);
      if (backend === 'github') {
        return await updateConfig(config => {
          config.backend = { ...config.backend, ...options };
        });
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
