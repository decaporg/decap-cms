import { login } from '../utils/steps';

const group = term => {
  cy.contains('span', 'Group by').click();
  cy.contains(term).click();
  cy.contains('Contents').click();
};

const assertGroupsCount = count => {
  cy.get('[class*=GroupContainer]').should('have.length', count);
};

const assertEachGroupCount = (id, count) => {
  cy.get(`[id='${id}']`).within(() => {
    assertEntriesCount(count);
  });
};

const assertEntriesCount = count => {
  cy.get('[class*=ListCardLink]').should('have.length', count);
};

const assertInEntries = text => {
  cy.get('[class*=ListCardLink]').within(() => {
    cy.contains('h2', text);
  });
};

describe('View Group', () => {
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

  it('can apply string group', () => {
    // enable group
    group('Year');

    assertGroupsCount(2);
    const year = new Date().getFullYear();
    assertEachGroupCount(`Year${year}`, 20);
    assertEachGroupCount('Year2015', 3);

    //disable group
    group('Year');

    assertEntriesCount(23);
    for (let i = 1; i <= 20; i++) {
      assertInEntries(`This is post # ${i} --`);
    }
    assertInEntries('This is a YAML front matter post');
    assertInEntries('This is a JSON front matter post');
    assertInEntries('This is a TOML front matter post');

    //enable group
    group('Drafts');

    assertEntriesCount(23);
    assertGroupsCount(3);
    assertEachGroupCount('Draftstrue', 10);
    assertEachGroupCount('Draftsfalse', 10);
    assertEachGroupCount('missing_value', 3);
  });
});
