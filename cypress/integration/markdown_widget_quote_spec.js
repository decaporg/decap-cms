import '../utils/dismiss-local-backup';

describe('Markdown widget', () => {
  describe('list', () => {
    before(() => {
      cy.loginAndNewPost();
    });

    beforeEach(() => {
      cy.clearMarkdownEditorContent();
    });

    describe('toggle quote', () => {
      it('toggles empty quote block on and off in empty editor', () => {
        cy.clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p></p>
            </blockquote>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <p></p>
          `);
      }); it('toggles empty quote block on and off for current block', () => {
        cy.focused()
          .type('foo')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
            </blockquote>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
          `);
      });
      it('toggles empty quote block on and off for selected blocks', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .setSelection('foo', 'bar')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <p>bar</p>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
          `);
      });
      it('toggles empty quote block on and off for partially selected blocks', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .setSelection('oo', 'ba')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <p>bar</p>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
          `);
      });
      it('toggles partial quote based on selection', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .setSelection('foo', 'baz')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
              <p>baz</p>
            </blockquote>
          `)
          .setSelection('foo')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <blockquote>
              <p>bar</p>
              <p>baz</p>
            </blockquote>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
            </blockquote>
            <blockquote>
              <p>bar</p>
              <p>baz</p>
            </blockquote>
          `)
          .right({ times: 2 })
          .backspace()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
              <p>baz</p>
            </blockquote>
          `)
          .setSelection('bar')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
            </blockquote>
            <p>bar</p>
            <blockquote>
              <p>baz</p>
            </blockquote>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
            </blockquote>
            <blockquote>
              <p>bar</p>
            </blockquote>
            <blockquote>
              <p>baz</p>
            </blockquote>
          `)
          .right({ times: 2 })
          .backspace()
          .setSelection('foo')
          .right({ times: 2 })
          .backspace()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
              <p>baz</p>
            </blockquote>
          `)
          .setSelection('baz')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
            <p>baz</p>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
            <blockquote>
              <p>baz</p>
            </blockquote>
          `)
          .left()
          .backspace()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
              <p>baz</p>
            </blockquote>
          `);
      });
    });

    describe('backspace inside quote', () => {
      it('joins two paragraphs', () => {
        cy.clickQuoteButton()
          .type('foo')
          .enter()
          .type('bar')
          .setCursorBefore('bar')
          .backspace()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foobar</p>
            </blockquote>
          `);
      });
    });

    describe('enter inside quote', () => {
      it('at end of block, creates new block inside quote', () => {
        cy.clickQuoteButton()
          .type('foo')
          .enter()
          .type('bar')
          .setCursorBefore('bar')
          .backspace()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
          `);
      });
    });
  });
});
