import '../utils/dismiss-local-backup';

const empty = `﻿<br>`;

describe('Markdown widget', () => {
  describe('code mark', () => {
    before(() => {
      cy.loginAndNewPost();
    });

    beforeEach(() => {
      cy.clearMarkdownEditorContent();
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
