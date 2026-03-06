export const before = (taskResult, options, backend) => {
  Cypress.config('taskTimeout', 5 * 60 * 1000); // 5 minutes
  cy.task('setupBackend', { backend, options }).then(data => {
    taskResult.data = data;
    Cypress.config('defaultCommandTimeout', data.mockResponses ? 5 * 1000 : 1 * 60 * 1000);
  });
};

export const after = (taskResult, backend) => {
  cy.task('teardownBackend', {
    backend,
    ...taskResult.data,
  });
};

export const beforeEach = (taskResult, backend) => {
  const spec = Cypress.mocha.getRunner().suite.ctx.currentTest.parent.title;
  const testName = Cypress.mocha.getRunner().suite.ctx.currentTest.title;
  
  console.log(`🧪 Starting test: ${testName} (${backend})`);
  
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

export const afterEach = (taskResult, backend) => {
  const spec = Cypress.mocha.getRunner().suite.ctx.currentTest.parent.title;
  const testName = Cypress.mocha.getRunner().suite.ctx.currentTest.title;

  let startTime;
  cy.then(() => {
    startTime = Date.now();
    console.log(`Starting teardown for: ${spec} - ${testName}`);
  });

  cy.task('teardownBackendTest', {
    backend,
    ...taskResult.data,
    spec,
    testName,
  }).then(() => {
    const duration = Date.now() - startTime;
    console.log(`Teardown completed in ${duration}ms for: ${spec} - ${testName}`);
  });

  if (!process.env.RECORD_FIXTURES) {
    const {
      suite: {
        ctx: {
          currentTest: { state, _retries: retries, _currentRetry: currentRetry },
        },
      },
    } = Cypress.mocha.getRunner();
    if (state === 'failed' && retries === currentRetry) {
      Cypress.runner.stop();
    }
  }
};

export const seedRepo = (taskResult, backend) => {
  cy.task('seedRepo', {
    backend,
    ...taskResult.data,
  });
};
