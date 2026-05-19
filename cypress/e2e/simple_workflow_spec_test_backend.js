import '../utils/dismiss-local-backup';
import {
  login,
  newPost,
  populateEntry,
  exitEditor,
  createPostAndPublish,
  assertPublishedEntry,
  editPostAndPublish,
  createPostPublishAndCreateNew,
  createPostPublishAndDuplicate,
  editPostPublishAndCreateNew,
  editPostPublishAndDuplicate,
  duplicatePostAndPublish,
} from '../utils/steps';

const entry1 = {
  title: 'first title',
  body: 'first body',
};
const entry2 = {
  title: 'second title',
  body: 'second body',
};

const backend = 'test';

describe('Test Backend Simple Workflow', () => {
  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend, options: { publish_mode: 'simple' } });
  });

  after(() => {
    cy.task('teardownBackend', { backend });
  });

  it('successfully loads', () => {
    login();
  });

  it('can create a new entry', () => {
    login();
    newPost();
    populateEntry(entry1, () => {});

    // new entry should show 'Unsaved changes'
    cy.contains('div', 'Unsaved Changes');
    cy.url().should('eq', `http://localhost:8080/#/collections/posts/new`);
    exitEditor();
  });

  it('can publish a new entry', () => {
    login();
    createPostAndPublish(entry1);
    assertPublishedEntry(entry1);
  });

  it('can publish a new entry and create new', () => {
    login();
    createPostPublishAndCreateNew(entry1);
    assertPublishedEntry(entry1);
  });

  it('can publish a new entry and duplicate', () => {
    login();
    createPostPublishAndDuplicate(entry1);
    assertPublishedEntry(entry1);
  });

  it('can edit an existing entry and publish', () => {
    login();
    createPostAndPublish(entry1);
    assertPublishedEntry(entry1);

    editPostAndPublish(entry1, entry2);
  });

  it('can edit an existing entry, publish and create new', () => {
    login();
    createPostAndPublish(entry1);
    assertPublishedEntry(entry1);

    editPostPublishAndCreateNew(entry1, entry2);
  });

  it('can edit an existing entry, publish and duplicate', () => {
    login();
    createPostAndPublish(entry1);
    assertPublishedEntry(entry1);

    editPostPublishAndDuplicate(entry1, entry2);
  });

  it('can duplicate an existing entry', () => {
    login();
    createPostAndPublish(entry1);
    assertPublishedEntry(entry1);

    duplicatePostAndPublish(entry1);
  });
});
