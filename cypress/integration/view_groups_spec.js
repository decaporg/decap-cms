import { login } from '../utils/steps';

const group = term => {
  cy.get('[class*=GroupButton]').click();
  cy.contains(term).click();
};

const assertGroupsCount = count => {
  cy.get('[class*=GroupTitle]').should('have.length', count);
};

const assertEachGroupCount = (className,count) => {
  cy.get('[class='+ className +']').within(() => {
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

const assertNotInEntries = text => {
  cy.get('[class*=ListCardLink]').within(() => {
    cy.contains('h2', text).should('not.exist');
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
    assertEachGroupCount("group-2020", 20);
    assertEachGroupCount("group-2015", 3);

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
    group('Country');

    assertEntriesCount(23);
    assertGroupsCount(1);

    //disable group
    group('Country');

    //enable group
    group('Drafts');

    assertEntriesCount(23);
    assertGroupsCount(3);
    assertEachGroupCount("group-true", 10);
    assertEachGroupCount("group-false", 10);
    assertEachGroupCount("group-other", 3);


  });
});
