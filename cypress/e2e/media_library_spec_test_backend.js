import fixture from './common/media_library';

const entries = [
  {
    title: 'first title',
    body: 'first body',
  },
];

describe('Test Backend Media Library', () => {
  after(() => {
    cy.task('teardownBackend', { backend: 'test' });
  });

  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend: 'test' });
  });

  fixture({ entries });
});
