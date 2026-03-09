// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
import 'cypress-plugin-tab';
import 'cypress-jest-adapter';
import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
  failureThreshold: 0.01,
  failureThresholdType: 'percent',
  customDiffConfig: { threshold: 0.09 },
  capture: 'viewport',
});

Cypress.on('uncaught:exception', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message);
  console.error('[UNCAUGHT EXCEPTION] Stack:', err.stack);
  return false; // Prevent Cypress from failing the test
});

import './commands';

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    const titlePath = this.currentTest.titlePath ? this.currentTest.titlePath().join(' > ') : '';
    // In headless CI, stopping the runner can leave the Cypress process hanging.
    if (Cypress.config('isInteractive')) {
      Cypress.runner.stop();
    } else {
      // eslint-disable-next-line no-console
      console.error(`[afterEach] Test failed in CI: ${titlePath || this.currentTest.title}`);
      if (this.currentTest.err?.message) {
        // eslint-disable-next-line no-console
        console.error(`[afterEach] Failure: ${this.currentTest.err.message}`);
      }
    }
  }
});
