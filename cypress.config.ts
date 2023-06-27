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
  },
});
