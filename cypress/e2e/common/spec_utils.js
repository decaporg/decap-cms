export function before(taskResult, options, backend) {
  Cypress.config('taskTimeout', 5 * 60 * 1000); // 5 minutes
  cy.task('setupBackend', { backend, options }).then(data => {
    taskResult.data = data;
    Cypress.config('defaultCommandTimeout', data.mockResponses ? 5 * 1000 : 1 * 60 * 1000);
  });
}

export function after(taskResult, backend) {
  cy.task('teardownBackend', {
    backend,
    ...taskResult.data,
  });
}

export function beforeEach(taskResult, backend) {
  const spec = Cypress.mocha.getRunner().suite.ctx.currentTest.parent.title;
  const testName = Cypress.mocha.getRunner().suite.ctx.currentTest.title;

  cy.task('log', `[beforeEach] backend=${backend} spec="${spec}" test="${testName}"`);
  cy.task('log', `[beforeEach] mockResponses=${String(taskResult.data.mockResponses)}`);

  cy.task('setupBackendTest', {
    backend,
    ...taskResult.data,
    spec,
    testName,
  }).then(() => {
    cy.task('log', '[beforeEach] setupBackendTest completed');
  });

  if (taskResult.data.mockResponses) {
    const fixture = `${spec}__${testName}.json`;
    cy.task('log', `[beforeEach] Loading fixture: "${fixture}"`);
    cy.stubFetch({ fixture }).then(() => {
      cy.task('log', '[beforeEach] stubFetch completed');
    });
  } else {
    cy.task('log', '[beforeEach] Skipping fixture load - mockResponses is false/undefined');
  }

  // cy.clock(0, ['Date']) was hanging git-gateway tests after page load
  // Hypothesis: freezing time to 0 breaks app initialization during cy.visit()
  // Temporary fix: skip cy.clock for git-gateway, use default clock for others
  if (backend !== 'git-gateway') {
    cy.task('log', '[beforeEach] Setting clock to epoch 0 for non-git-gateway');
    return cy.clock(0, ['Date']);
  }

  cy.task('log', '[beforeEach] Skipped clock for git-gateway');
}

export function afterEach(taskResult, backend) {
  const spec = Cypress.mocha.getRunner().suite.ctx.currentTest.parent.title;
  const testName = Cypress.mocha.getRunner().suite.ctx.currentTest.title;

  cy.task('teardownBackendTest', {
    backend,
    ...taskResult.data,
    spec,
    testName,
  });

  if (!process.env.RECORD_FIXTURES) {
    const {
      suite: {
        ctx: {
          currentTest: { state, _retries: retries, _currentRetry: currentRetry, err },
        },
      },
    } = Cypress.mocha.getRunner();

    cy.task(
      'log',
      `[afterEach] backend=${backend} test="${testName}" state=${state} retry=${currentRetry}/${retries}`,
    );
    if (state === 'failed' && err?.message) {
      cy.task('log', `[afterEach] failure: ${err.message}`);
    }

    if (state === 'failed' && retries === currentRetry) {
      // Avoid deadlock in headless CI: runner.stop can leave recorded parallel runs hanging.
      if (Cypress.config('isInteractive')) {
        Cypress.runner.stop();
      }
    }
  }
}

export function seedRepo(taskResult, backend) {
  cy.task('seedRepo', {
    backend,
    ...taskResult.data,
  });
}
