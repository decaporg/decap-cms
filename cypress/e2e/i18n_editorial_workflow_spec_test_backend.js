import fixture from './common/i18n_editorial_workflow_spec';

const backend = 'test';

describe(`I18N Test Backend Editorial Workflow`, () => {
  const taskResult = { data: {} };

  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', {
      backend,
      options: {
        publish_mode: 'editorial_workflow',
        i18n: {
          locales: ['en', 'de', 'fr'],
        },
        collections: [
          {
            folder: 'content/i18n',
            i18n: true,
            fields: [{ i18n: true }, {}, { i18n: 'duplicate' }],
          },
        ],
      },
    });
  });

  after(() => {
    cy.task('teardownBackend', { backend });
  });

  const entry = {
    title: 'first title',
    body: 'first body',
  };

  fixture({ entry, getUser: () => taskResult.data.user });
});
