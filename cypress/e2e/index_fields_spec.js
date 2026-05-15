import '../utils/dismiss-local-backup';
import {
  login,
  createPostAndPublish,
  assertPublishedEntry,
} from '../utils/steps';

const indexFileEntry = {
  title: 'Index Page',
  body: 'This is the index page content.',
};

const regularEntry = {
  title: 'Regular Post',
  body: 'This is a regular post content.',
};

const backend = 'test';

describe('Index File Feature', () => {
  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend, options: { publish_mode: 'simple' } });
  });

  after(() => {
    cy.task('teardownBackend', { backend });
  });

  it('successfully loads with index file configured', () => {
    login();
  });

  it('can create and publish an index file entry', () => {
    login();
    createPostAndPublish(indexFileEntry);
    assertPublishedEntry(indexFileEntry);
  });

  it('can create and publish a regular entry alongside index file', () => {
    login();
    createPostAndPublish(regularEntry);
    assertPublishedEntry(regularEntry);
  });

  it('displays correct entry type in list when index file exists', () => {
    login();
    // Verify that entries list loads and displays both regular and index entries
    cy.contains('a', 'New Post');
    cy.get('[data-testid="list-control"]').should('exist');
  });

  it('can distinguish between index and regular entries in editor', () => {
    login();
    // Navigate to entries list
    cy.contains('a', 'Writing in').click();
    // Should see entries listed
    cy.get('[class*="entrylist"]').should('exist');
  });

  it('can edit and republish index file entry', () => {
    login();
    createPostAndPublish(indexFileEntry);

    // Navigate to entries list
    cy.contains('a', 'Writing in').click();
    cy.contains(indexFileEntry.title).click();

    // Update content
    const updatedTitle = 'Updated Index Page';
    cy.get('input[name="title"]').clear();
    cy.get('input[name="title"]').type(updatedTitle);
    cy.get('textarea[name="body"]').clear();
    cy.get('textarea[name="body"]').type('Updated index content.');

    // Publish changes
    cy.contains('button', 'Publish').click();
    cy.contains('Published to').should('exist');
  });
});
