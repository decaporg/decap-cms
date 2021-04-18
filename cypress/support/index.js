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
import 'cypress-file-upload';
import 'cypress-jest-adapter';
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
  failureThreshold: 0.01,
  failureThresholdType: 'percent',
  customDiffConfig: { threshold: 0.09 },
  capture: 'viewport',
});

Cypress.on('uncaught:exception', () => false);

import './commands';
