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
  cy.get('[class*=ListCardLink] h2').contains(text);
};

const assertNotInEntries = text => {
  cy.get('[class*=ListCardLink] h2').contains(text).should('not.exist');
};

// dev-test/index.html seeds 15 listed blog posts: 12 carry a category and a featured flag,
// the 3 front matter format posts carry neither. A 16th file has a .other extension and is
// never listed. See dev-test/config.yml for the filters these names come from.
const TOTAL = 15;
const TUTORIALS = 5;
const RELEASE_NOTES = 3;
const FEATURED = 4;

const FORMAT_POSTS = ['Front matter in YAML', 'Front matter in JSON', 'Front matter in TOML'];

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
    filter('Tutorials');

    assertEntriesCount(TUTORIALS);
    assertInEntries('Modelling content with collections');
    assertInEntries('A field guide to the relation widget');
    FORMAT_POSTS.forEach(assertNotInEntries);

    // disable filter
    filter('Tutorials');
    assertEntriesCount(TOTAL);
    assertInEntries('Modelling content with collections');
    FORMAT_POSTS.forEach(assertInEntries);
  });

  it('can apply multiple filters', () => {
    // enable filter
    filter('Release Notes');

    assertEntriesCount(RELEASE_NOTES);
    assertInEntries('Decap CMS 3.8');
    assertInEntries('Decap CMS 3.7');
    assertInEntries('Decap CMS 3.6');

    // a post has exactly one category, so combining two category filters matches nothing
    filter('Tutorials');

    assertEntriesCount(0);

    cy.contains('div', 'No Entries');
  });

  it('can apply boolean filter', () => {
    // enable filter
    filter('Featured');

    assertEntriesCount(FEATURED);
    assertInEntries('Modelling content with collections');
    assertInEntries('Editorial workflow, end to end');
    assertInEntries('Decap CMS 3.8');
    assertInEntries('Running Decap on a large marketing site');
    assertNotInEntries('A field guide to the relation widget');
    FORMAT_POSTS.forEach(assertNotInEntries);

    // disable filter
    filter('Featured');
    assertEntriesCount(TOTAL);
    assertInEntries('A field guide to the relation widget');
    FORMAT_POSTS.forEach(assertInEntries);
  });
});
