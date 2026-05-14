export function before(taskResult, options, backend) {
  console.log(`[spec_utils.before] START backend=${backend}`);
  Cypress.config('taskTimeout', 5 * 60 * 1000); // 5 minutes
  cy.task('setupBackend', { backend, options }).then(data => {
    console.log('[spec_utils.before] setupBackend completed, data=', data);
    taskResult.data = data;
    Cypress.config('defaultCommandTimeout', data.mockResponses ? 5 * 1000 : 1 * 60 * 1000);
    console.log(`[spec_utils.before] COMPLETE mockResponses=${data.mockResponses} timeout=${data.mockResponses ? 5000 : 60000}ms`);
  });
}

export function after(taskResult, backend) {
  console.log(`[spec_utils.after] START backend=${backend}`);
  cy.task('teardownBackend', {
    backend,
    ...taskResult.data,
  }).then(() => {
    console.log('[spec_utils.after] COMPLETE');
  });
}

export function beforeEach(taskResult, backend) {
  const spec = Cypress.mocha.getRunner().suite.ctx.currentTest.parent.title;
  const testName = Cypress.mocha.getRunner().suite.ctx.currentTest.title;

  console.log(`[spec_utils.beforeEach] START backend=${backend} spec="${spec}" test="${testName}"`);
  console.log(`[spec_utils.beforeEach] mockResponses=${taskResult.data.mockResponses}`);
  console.log(`[spec_utils.beforeEach] user=`, JSON.stringify(taskResult.data.user || {}));

  cy.task('setupBackendTest', {
    backend,
    ...taskResult.data,
    spec,
    testName,
  }).then(() => {
    console.log('[spec_utils.beforeEach] setupBackendTest completed');
  });

  if (taskResult.data.mockResponses) {
    const fixture = `${spec}__${testName}.json`;
    console.log(`[spec_utils.beforeEach] Loading fixture: ${fixture}`);
    cy.stubFetch({ fixture }).then(() => {
      console.log('[spec_utils.beforeEach] stubFetch completed');
    });
  } else {
    console.log('[spec_utils.beforeEach] WARNING: mockResponses is false/undefined - no fixture loaded');
  }

  // cy.clock(0, ['Date']) was hanging git-gateway tests after page load
  // Hypothesis: freezing time to 0 breaks app initialization during cy.visit()
  // Temporary fix: skip cy.clock for git-gateway, use default clock for others
  if (backend !== 'git-gateway') {
    console.log('[spec_utils.beforeEach] Setting clock to epoch 0');
    return cy.clock(0, ['Date']);
  }

  console.log('[spec_utils.beforeEach] COMPLETE - skipped clock for git-gateway');
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
          currentTest: { state, _retries: retries, _currentRetry: currentRetry },
        },
      },
    } = Cypress.mocha.getRunner();

    if (state === 'failed' && retries === currentRetry) {
      Cypress.runner.stop();
    }
  }
}

export function seedRepo(taskResult, backend) {
  cy.task('seedRepo', {
    backend,
    ...taskResult.data,
  });
}
