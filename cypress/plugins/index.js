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
const { setupGitLab, teardownGitLab, setupGitLabTest, teardownGitLabTest } = require('./gitlab');
const {
  setupBitBucket,
  teardownBitBucket,
  setupBitBucketTest,
  teardownBitBucketTest,
} = require('./bitbucket');
const { setupProxy, teardownProxy, setupProxyTest, teardownProxyTest } = require('./proxy');

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
        case 'gitlab':
          result = await setupGitLab(options);
          break;
        case 'bitbucket':
          result = await setupBitBucket(options);
          break;
        case 'proxy':
          result = await setupProxy(options);
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
        case 'gitlab':
          await teardownGitLab(taskData);
          break;
        case 'bitbucket':
          await teardownBitBucket(taskData);
          break;
        case 'proxy':
          await teardownProxy(taskData);
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
        case 'gitlab':
          await setupGitLabTest(taskData);
          break;
        case 'bitbucket':
          await setupBitBucketTest(taskData);
          break;
        case 'proxy':
          await setupProxyTest(taskData);
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
        case 'gitlab':
          await teardownGitLabTest(taskData);
          break;
        case 'bitbucket':
          await teardownBitBucketTest(taskData);
          break;
        case 'proxy':
          await teardownProxyTest(taskData);
          break;
      }

      return null;
    },
  });

  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.name === 'chrome') {
      // to allows usage of a mock proxy
      launchOptions.args.push('--ignore-certificate-errors');
      launchOptions.args.push('-–disable-gpu');
      if (browser.isHeaded) {
        launchOptions.args.push('--window-size=1200,1200');
      } else {
        launchOptions.args.push('--window-size=1200,1077');
      }

      return launchOptions;
    }
  });

  addMatchImageSnapshotPlugin(on, config);
};
