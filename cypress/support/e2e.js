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

Cypress.on('uncaught:exception', err => {
  console.error('[UNCAUGHT EXCEPTION]', err.message);
  console.error('[UNCAUGHT EXCEPTION] Stack:', err.stack);
  return false; // Prevent Cypress from failing the test
});

// TEMPORARY (decap-turbo e2e triage). The editorial-workflow specs fail on this
// branch and not on main, and `cypress run` stdout carries only the assertion
// message — no browser console, so the "No route match for api request" warning
// that cy.stubFetch already emits is invisible in CI. This reports it, plus just
// enough DOM state to tell the two failure shapes apart: an editor that never
// rendered its toolbar, versus a Workflow board with empty columns.
// Remove this hook, the `log` task in cypress/plugins/index.js, and the
// accumulator in cypress/support/commands.js together.
beforeEach(() => {
  Cypress.__unmatchedRoutes = [];
});

afterEach(function reportDiagnosticsOnFailure() {
  if (!this.currentTest || this.currentTest.state !== 'failed') {
    return;
  }

  const unmatched = Cypress.__unmatchedRoutes || [];
  const win = cy.state('window');
  const doc = win && win.document;
  const text = (doc && doc.body && doc.body.innerText) || '';

  const diagnostics = {
    test: this.currentTest.fullTitle(),
    href: (win && win.location && win.location.href) || null,
    // Distinguishes the two shapes: the back link is the editor toolbar, and
    // the column headings mean the Workflow board rendered at all.
    hasEditorBackLink: doc
      ? Array.from(doc.querySelectorAll('a')).some(a => /Writing in/.test(a.textContent))
      : null,
    columnHeadings: doc
      ? Array.from(doc.querySelectorAll('h2')).map(h => h.textContent.trim())
      : null,
    entryLinkCount: doc ? doc.querySelectorAll('[class*="column"] a').length : null,
    visibleLines: text.split('\n').filter(Boolean).slice(0, 30),
    unmatchedRouteCount: unmatched.length,
    unmatchedRoutes: unmatched.slice(0, 40),
  };

  cy.task('log', `[E2E-DIAG] ${JSON.stringify(diagnostics, null, 2)}`, { log: false });
});

import './commands';
