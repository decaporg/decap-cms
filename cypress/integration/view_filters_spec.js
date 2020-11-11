import { login } from '../utils/steps';

const filter = term => {
  cy.contains('span', 'Filter by').click();
  cy.contains(term).click();
  cy.contains('Contents').click();
};

const assertEntriesCount = count => {
  cy.get('[class*=ListCardLink]').should('have.length', count);
};

const assertInEntries = text => {
  cy.get('[class*=ListCardLink]').within(() => {
    cy.contains('h2', text);
  });
};

const assertNotInEntries = text => {
  cy.get('[class*=ListCardLink]').within(() => {
    cy.contains('h2', text).should('not.exist');
  });
};

describe('View Filter', () => {
  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend: 'test' });
  });

  after(() => {
    cy.task('teardownBackend', { backend: 'test' });
  });

  beforeEach(() => {
    login();
  });

  it('can apply string filter', () => {
    // enable filter
    filter('Posts With Index');

    assertEntriesCount(20);
    for (let i = 1; i <= 20; i++) {
      assertInEntries(`This is post # ${i} --`);
    }
    assertNotInEntries('This is a YAML front matter post');
    assertNotInEntries('This is a JSON front matter post');
    assertNotInEntries('This is a TOML front matter post');

    // disable filter
    filter('Posts With Index');
    assertEntriesCount(23);
    for (let i = 1; i <= 20; i++) {
      assertInEntries(`This is post # ${i} --`);
    }
    assertInEntries('This is a YAML front matter post');
    assertInEntries('This is a JSON front matter post');
    assertInEntries('This is a TOML front matter post');
  });

  it('can apply boolean filter', () => {
    // enable filter
    filter('Drafts');

    assertEntriesCount(10);
    for (let i = 1; i <= 20; i++) {
      const draft = i % 2 === 0;
      if (draft) {
        assertInEntries(`This is post # ${i} --`);
      } else {
        assertNotInEntries(`This is post # ${i} --`);
      }
    }
    assertNotInEntries('This is a YAML front matter post');
    assertNotInEntries('This is a JSON front matter post');
    assertNotInEntries('This is a TOML front matter post');

    // disable filter
    filter('Drafts');
    assertEntriesCount(23);
    for (let i = 1; i <= 20; i++) {
      assertInEntries(`This is post # ${i} --`);
    }
    assertInEntries('This is a YAML front matter post');
    assertInEntries('This is a JSON front matter post');
    assertInEntries('This is a TOML front matter post');
  });

  it('can apply multiple filters', () => {
    // enable filter
    filter('Posts Without Index');

    assertEntriesCount(3);

    assertInEntries('This is a YAML front matter post');
    assertInEntries('This is a JSON front matter post');
    assertInEntries('This is a TOML front matter post');

    filter('Drafts');

    assertEntriesCount(0);

    cy.contains('div', 'No Entries');
  });
});
