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
  cy.get('[class*=ListCardLink] h2').contains(collection ?? text);
};

const assertNotInSearch = text => {
  cy.get('[class*=ListCardLink] h2').contains(text).should('not.exist');
};

// "content" appears in a blog post title and in a FAQ question, so it exercises both
// collections. See dev-test/index.html for the seed data behind these titles.
const POST = 'Modelling content with collections';
const FAQ_ITEM = 'Where is my content stored?';

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
    search('content', 'All Collections');

    assertSearchHeading('Search Results for "content"');

    assertSearchResult(POST, 'Blog Posts');
    assertSearchResult(FAQ_ITEM, 'FAQ');
  });

  it('can search in posts collection', () => {
    search('content', 'Blog Posts');

    assertSearchHeading('Search Results for "content" in Blog Posts');

    assertSearchResult(POST);

    assertNotInSearch(FAQ_ITEM);
  });

  it('can search in faq collection', () => {
    search('content', 'FAQ');

    assertSearchHeading('Search Results for "content" in FAQ');

    assertSearchResult(FAQ_ITEM);

    assertNotInSearch(POST);
  });
});
