import '../utils/dismiss-local-backup';

describe('Markdown widget link', () => {
  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend: 'test' });
  });

  beforeEach(() => {
    cy.loginAndNewPost();
    cy.clearMarkdownEditorContent();
  });

  after(() => {
    cy.task('teardownBackend', { backend: 'test' });
  });

  describe('link', () => {
    it('can add a new valid link', () => {
      const link = 'https://www.decapcms.org/';
      cy.window().then(win => {
        cy.stub(win, 'prompt').returns(link);
      });
      cy.focused().clickLinkButton();

      cy.confirmMarkdownEditorContent(`<p><a>${link}</a></p>`);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.clickModeToggle();

      cy.confirmRawEditorContent(`<${link}>`);
    });

    it('can add a new invalid link', () => {
      const link = 'www.decapcms.org';
      cy.window().then(win => {
        cy.stub(win, 'prompt').returns(link);
      });
      cy.focused().clickLinkButton();

      cy.confirmMarkdownEditorContent(`<p><a>${link}</a></p>`);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.clickModeToggle();

      cy.confirmRawEditorContent(`[${link}](${link})`);
    });

    it('can select existing text as link', () => {
      const link = 'https://www.decapcms.org';
      cy.window().then(win => {
        cy.stub(win, 'prompt').returns(link);
      });

      const text = 'Decap CMS';
      cy.focused()
        .getMarkdownEditor()
        .type(text)
        .setSelection(text)
        .clickLinkButton();

      cy.confirmMarkdownEditorContent(`<p><a>${text}</a></p>`);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.clickModeToggle();

      cy.confirmRawEditorContent(`[${text}](${link})`);
    });
  });
});
