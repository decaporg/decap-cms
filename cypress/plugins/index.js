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
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');

const { setupGitHub, teardownGitHub, setupGitHubTest, teardownGitHubTest } = require('./github');
const {
  setupGitGateway,
  teardownGitGateway,
  setupGitGatewayTest,
  teardownGitGatewayTest,
} = require('./gitGateway');
const { copyBackendFiles } = require('../utils/config');

module.exports = async (on, config) => {
  // `on` is used to hook into various events Cypress emits
  on('task', {
    async setupBackend({ backend, options }) {
      console.log('Preparing environment for backend', backend);
      await copyBackendFiles(backend);

      let result = null;
      switch (backend) {
        case 'github':
          result = await setupGitHub(options);
          break;
        case 'git-gateway':
          result = await setupGitGateway(options);
          break;
      }

      return result;
    },
    async teardownBackend(taskData) {
      const { backend } = taskData;
      console.log('Tearing down backend', backend);

      switch (backend) {
        case 'github':
          await teardownGitHub(taskData);
          break;
        case 'git-gateway':
          await teardownGitGateway(taskData);
          break;
      }

      console.log('Restoring defaults');
      await copyBackendFiles('test');

      return null;
    },
    async setupBackendTest(taskData) {
      const { backend, testName } = taskData;
      console.log(`Setting up single test '${testName}' for backend`, backend);

      switch (backend) {
        case 'github':
          await setupGitHubTest(taskData);
          break;
        case 'git-gateway':
          await setupGitGatewayTest(taskData);
          break;
      }

      return null;
    },
    async teardownBackendTest(taskData) {
      const { backend, testName } = taskData;

      console.log(`Tearing down single test '${testName}' for backend`, backend);

      switch (backend) {
        case 'github':
          await teardownGitHubTest(taskData);
          break;
        case 'git-gateway':
          await teardownGitGatewayTest(taskData);
          break;
      }

      return null;
    },
  });

  on('before:browser:launch', (browser = {}, args) => {
    if (browser.name === 'chrome') {
      // to allows usage of a mock proxy
      args.push('--ignore-certificate-errors');

      return args;
    }

    if (browser.name === 'electron') {
      // to allows usage of a mock proxy
      args['ignore-certificate-errors'] = true;
      // https://github.com/cypress-io/cypress/issues/2102
      if (browser.isHeaded) {
        args['width'] = 1200;
        args['height'] = 1200;
      } else {
        args['width'] = 1200;
        args['height'] = process.platform === 'darwin' ? 1178 : 1200;
      }

      return args;
    }
  });

  addMatchImageSnapshotPlugin(on, config);
};
