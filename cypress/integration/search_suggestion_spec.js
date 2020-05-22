import { login } from '../utils/steps';

const search = (term, collection) => {
  cy.get('[class*=SearchInput]').clear({ force: true });
  cy.get('[class*=SearchInput]').type(term, { force: true });
  cy.get('[class*=SuggestionsContainer]').within(() => {
    cy.contains(collection).click();
  });
};

const assertSearchHeading = title => {
  cy.get('[class*=SearchResultHeading]').should('have.text', title);
};

const assertSearchResult = (text, collection) => {
  cy.get('[class*=ListCardLink]').within(() => {
    if (collection) {
      cy.contains('h2', collection);
    }
    cy.contains('h2', text);
  });
};

const assertNotInSearch = text => {
  cy.get('[class*=ListCardLink]').within(() => {
    cy.contains('h2', text).should('not.exist');
  });
};

describe('Search Suggestion', () => {
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

  it('can search in all collections', () => {
    search('this', 'All Collections');

    assertSearchHeading('Search Results for "this"');

    assertSearchResult('This is post # 20', 'Posts');
    assertSearchResult('This is a TOML front matter post', 'Posts');
    assertSearchResult('This is a JSON front matter post', 'Posts');
    assertSearchResult('This is a YAML front matter post', 'Posts');
    assertSearchResult('This FAQ item # 5', 'FAQ');
  });

  it('can search in posts collection', () => {
    search('this', 'Posts');

    assertSearchHeading('Search Results for "this" in Posts');

    assertSearchResult('This is post # 20');
    assertSearchResult('This is a TOML front matter post');
    assertSearchResult('This is a JSON front matter post');
    assertSearchResult('This is a YAML front matter post');

    assertNotInSearch('This FAQ item # 5');
  });

  it('can search in faq collection', () => {
    search('this', 'FAQ');

    assertSearchHeading('Search Results for "this" in FAQ');

    assertSearchResult('This FAQ item # 5');

    assertNotInSearch('This is post # 20');
  });
});
