const backend = 'github';

export const before = (taskResult, options) => {
  Cypress.config('taskTimeout', 5 * 60 * 1000);
  cy.task('setupBackend', { backend, options }).then(data => {
    taskResult.data = data;
    Cypress.config('defaultCommandTimeout', data.mockResponses ? 5 * 1000 : 1 * 60 * 1000);
  });
};

export const after = taskResult => {
  cy.task('teardownBackend', {
    backend,
    ...taskResult.data,
  });
};

export const beforeEach = taskResult => {
  const spec = Cypress.mocha.getRunner().suite.ctx.currentTest.parent.title;
  const testName = Cypress.mocha.getRunner().suite.ctx.currentTest.title;
  cy.task('setupBackendTest', {
    backend,
    ...taskResult.data,
    spec,
    testName,
  });

  if (taskResult.data.mockResponses) {
    const fixture = `${spec}__${testName}.json`;
    console.log('loading fixture:', fixture);
    cy.stubFetch({ fixture });
  }

  return cy.clock(0, ['Date']);
};

export const afterEach = taskResult => {
  const spec = Cypress.mocha.getRunner().suite.ctx.currentTest.parent.title;
  const testName = Cypress.mocha.getRunner().suite.ctx.currentTest.title;

  cy.task('teardownBackendTest', {
    backend,
    ...taskResult.data,
    spec,
    testName,
  });

  if (Cypress.mocha.getRunner().suite.ctx.currentTest.state === 'failed') {
    Cypress.runner.stop();
  }
};
