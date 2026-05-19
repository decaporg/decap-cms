import '../utils/dismiss-local-backup';

describe('Markdown widget', () => {
  describe('code mark', () => {
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

    describe('toolbar button', () => {
      it('can combine code mark with other marks', () => {
        cy.clickItalicButton()
          .type('foo')
          .setSelection('oo')
          .clickCodeButton()
          .confirmMarkdownEditorContent(`
            <p>
              <em>f</em>
              <code>
                <em>oo</em>
              </code>
            </p>
          `);
      });
    });
  });
});
