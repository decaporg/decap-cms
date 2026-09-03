import '../utils/dismiss-local-backup';
import { login, exitEditor, publishEntry, assertNotification } from '../utils/steps';
import { notifications } from '../utils/constants';

const backend = 'test';

/**
 * The dev-test `posts` collection is configured with:
 *
 *   index_file:
 *     pattern: _index
 *     editor: { preview: false }
 *     fields: [title, body]
 *
 * and ships a matching `_posts/_index.md` fixture. Everything below asserts that an entry
 * matching that pattern is treated differently from the rest of the collection.
 */
const indexEntryTitle = 'Posts list page';
const regularEntryTitle = 'This is a YAML front matter post';

const entryCards = () => cy.get('[class*=ListCardLink]');
const indexFileIcons = () => cy.get('[class*=ListCardLink] [class*=TitleIcons] svg');
const previewPane = () => cy.get('[class*=PreviewPaneFrame]');

function openEntry(title) {
  cy.contains('[class*=ListCardLink]', title).click();
}

/**
 * The collection view pages in 20 entries at a time, and the index file is hoisted to the
 * top client side, over the entries that are already loaded. The dev-test posts collection
 * has 24 entries and the index file sorts last by date, so it is not on the first page at
 * all: everything below has to page the whole collection in before it can see it.
 */
function loadWholeCollection() {
  cy.get('[class*=ListCardLink]').should('have.length', 20);
  cy.scrollTo('bottom');
  cy.get('[class*=ListCardLink]').should('have.length', 24);
}

describe('Index File Feature', () => {
  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend, options: { publish_mode: 'simple' } });
  });

  after(() => {
    cy.task('teardownBackend', { backend });
  });

  beforeEach(() => {
    login();
  });

  describe('in the posts collection', () => {
    beforeEach(() => {
      loadWholeCollection();
    });

    it('sorts the index file to the top of the collection', () => {
      entryCards().first().should('contain.text', indexEntryTitle);
    });

    it('marks only the index file entry with an icon', () => {
      // the icon lives on the index entry's card and on no other
      indexFileIcons().should('have.length', 1);
      cy.contains('[class*=ListCardLink]', indexEntryTitle).find('[class*=TitleIcons] svg');
    });

    it('edits the index file entry with the index fields', () => {
      openEntry(indexEntryTitle);

      cy.contains('label', 'Title');
      cy.contains('label', 'Body');
      // fields that only exist on the collection's regular entries
      cy.contains('label', 'Publish Date').should('not.exist');
      cy.contains('label', 'Cover Image').should('not.exist');
    });

    it('edits a regular entry with the collection fields', () => {
      openEntry(regularEntryTitle);

      cy.contains('label', 'Title');
      cy.contains('label', 'Publish Date');
      cy.contains('label', 'Cover Image');
    });

    it('disables the editor preview for the index file entry only', () => {
      openEntry(indexEntryTitle);
      previewPane().should('not.exist');

      exitEditor();

      openEntry(regularEntryTitle);
      previewPane().should('exist');
    });

    it('can edit and republish the index file entry', () => {
      const updatedTitle = 'Updated posts list page';

      openEntry(indexEntryTitle);
      cy.get('[id^="title-field"]').clear();
      cy.get('[id^="title-field"]').type(updatedTitle);
      publishEntry();
      assertNotification(notifications.saved);

      // the entry is written back to the same file rather than re-slugged from the new title
      cy.url().should('contain', '/collections/posts/entries/_index');

      exitEditor();

      // still the collection's only index file, still sorted to the top
      // (the card summary itself is not re-fetched after a save, which is pre-existing behaviour)
      entryCards().first().should('contain.text', indexEntryTitle);
      indexFileIcons().should('have.length', 1);
    });
  });

  describe('in a nested collection', () => {
    /**
     * The dev-test `sections` collection is nested and configured with both
     *
     *   index_file: { pattern: '^index$', ... }   // which entries get the index fields
     *   meta: { path: { index_file: index } }     // the filename an index entry is written to
     *
     * which together let one collection hold index pages and content pages side by side.
     */
    const newEntryDropdown = () => cy.contains('[role="button"]', '＋ Section');

    function chooseNewEntryType(label) {
      newEntryDropdown().click();
      cy.contains('[role="menuitem"] span', label).click();
    }

    beforeEach(() => {
      cy.contains('a', 'Sections').click();
    });

    it('offers a path type when creating an entry', () => {
      newEntryDropdown().click();
      cy.contains('[role="menuitem"] span', 'Index Page');
      cy.contains('[role="menuitem"] span', 'Content Page');
    });

    it('creates an index page as the folder index file', () => {
      chooseNewEntryType('Index Page');
      cy.url().should('contain', 'path_type=index');

      cy.get('[id^="path-field"]').clear();
      cy.get('[id^="path-field"]').type('guides/advanced');
      cy.get('[id^="title-field"]').type('Advanced guides');
      publishEntry();
      assertNotification(notifications.saved);

      // written to `_sections/guides/advanced/index.md`
      cy.url().should('contain', '/collections/sections/entries/guides/advanced/index');
    });

    it('creates a content page at its own slug', () => {
      chooseNewEntryType('Content Page');
      cy.url().should('contain', 'path_type=slug');

      cy.get('[id^="path-field"]').clear();
      cy.get('[id^="path-field"]').type('guides/second-steps');
      cy.get('[id^="title-field"]').type('Second steps');
      cy.getMarkdownEditor().first().click();
      cy.getMarkdownEditor().first().type('A regular content page.');
      publishEntry();
      assertNotification(notifications.saved);

      // written to `_sections/guides/second-steps.md`, not to a folder index file
      cy.url().should('contain', '/collections/sections/entries/guides/second-steps');
      cy.url().should('not.contain', 'second-steps/index');
    });
  });
});
