import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: '1c35bs',
  retries: {
    runMode: 4,
    openMode: 0,
  },
  e2e: {
    video: false,
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/*spec*.js',
    // Enable document.domain injection for cross-origin navigation compatibility
    // Required for Cypress 14 to support editorial workflow tests that navigate between origins
    injectDocumentDomain: true,
  },
});
