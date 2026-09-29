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
  cy.get('[class*=ListCardLink] h2').contains('h2', text);
};

// dev-test/index.html seeds 15 listed blog posts on fixed dates, so these counts do not
// drift with the current date. The 3 front matter format posts carry no category and no
// featured flag, which is what produces the missing_value group.
const TOTAL = 15;

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

    assertGroupsCount(4);
    assertEachGroupCount('Year2026', 6);
    assertEachGroupCount('Year2025', 4);
    assertEachGroupCount('Year2024', 2);
    assertEachGroupCount('Year2015', 3);

    //disable group
    group('Year');

    assertEntriesCount(TOTAL);
    assertInEntries('Modelling content with collections');
    assertInEntries('Front matter in YAML');
    assertInEntries('Front matter in JSON');
    assertInEntries('Front matter in TOML');

    //enable group
    group('Category');

    assertEntriesCount(TOTAL);
    assertGroupsCount(5);
    assertEachGroupCount('CategoryTutorial', 5);
    assertEachGroupCount('CategoryRelease Notes', 3);
    assertEachGroupCount('CategoryCase Study', 2);
    assertEachGroupCount('CategoryOpinion', 2);
    assertEachGroupCount('missing_value', 3);

    //switch group
    group('Featured');

    assertEntriesCount(TOTAL);
    assertGroupsCount(3);
    assertEachGroupCount('Featuredtrue', 4);
    assertEachGroupCount('Featuredfalse', 8);
    assertEachGroupCount('missing_value', 3);
  });
});
