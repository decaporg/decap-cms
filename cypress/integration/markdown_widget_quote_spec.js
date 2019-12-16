import '../utils/dismiss-local-backup';

describe('Markdown widget', () => {
  describe('quote block', () => {
    before(() => {
      Cypress.config('defaultCommandTimeout', 4000);
      cy.task('setupBackend', { backend: 'test' });
      cy.loginAndNewPost();
    });

    beforeEach(() => {
      cy.clearMarkdownEditorContent();
    });

    after(() => {
      cy.task('teardownBackend', { backend: 'test' });
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
      });
      it('toggles empty quote block on and off for current block', () => {
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
      it('toggles entire quote block without expanded selection', () => {
        cy.clickQuoteButton()
          .type('foo')
          .enter()
          .type('bar')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <p>bar</p>
          `);
      });
      it('toggles entire quote block with complex content', () => {
        cy.clickQuoteButton()
          .clickUnorderedListButton()
          .clickHeadingOneButton()
          .type('foo')
          .enter({ times: 3 })
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <h1>foo</h1>
              </li>
            </ul>
            <p></p>
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
      it('toggles quote block on and off for multiple selected list items', () => {
        cy.focused()
          .clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .type('bar')
          .setSelection('foo', 'bar')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <ul>
                <li>
                  <p>foo</p>
                </li>
                <li>
                  <p>bar</p>
                </li>
              </ul>
            </blockquote>
          `)
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
            </ul>
          `)
          .setCursorAfter('bar')
          .enter({ times: 2 })
          .type('baz')
          .setSelection('bar', 'baz')
          .clickQuoteButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <blockquote>
              <ul>
                <li>
                  <p>bar</p>
                </li>
                <li>
                  <p>baz</p>
                </li>
              </ul>
            </blockquote>
          `)
      });
      it('creates new quote block if parent is not a quote, can deeply nest', () => {
        cy.clickQuoteButton()
          .clickUnorderedListButton()
          .clickQuoteButton()
          .clickUnorderedListButton()
          .clickQuoteButton()
          .clickUnorderedListButton()
          .clickQuoteButton()
          .type('foo')
          .enter({ times: 10 })
          .type('bar')
          .confirmMarkdownEditorContent(`
            <blockquote>
              <ul>
                <li>
                  <blockquote>
                    <ul>
                      <li>
                        <blockquote>
                          <ul>
                            <li>
                              <blockquote>
                                <p>foo</p>
                              </blockquote>
                            </li>
                          </ul>
                        </blockquote>
                      </li>
                    </ul>
                  </blockquote>
                </li>
              </ul>
              <p>bar</p>
            </blockquote>
          `)
          .backspace({ times: 12 })
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
      it('joins quote with previous quote', () => {
        cy.clickQuoteButton()
          .type('foo')
          .enter({ times: 2 })
          .clickQuoteButton()
          .type('bar')
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
            </blockquote>
            <blockquote>
              <p>bar</p>
            </blockquote>
          `)
          .setCursorBefore('bar')
          .backspace()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>bar</p>
            </blockquote>
          `);
      });
      it('removes first block from quote when focused at first block at start', () => {
        cy.clickQuoteButton()
          .type('foo')
          .enter()
          .type('bar')
          .setCursorBefore('foo')
          .backspace()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <blockquote>
              <p>bar</p>
            </blockquote>
          `)
      });
    });

    describe('enter inside quote', () => {
      it('creates new block inside quote', () => {
        cy.clickQuoteButton()
          .type('foo')
          .enter()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p></p>
            </blockquote>
          `)
          .type('bar')
          .setCursorAfter('ba')
          .enter()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
              <p>ba</p>
              <p>r</p>
            </blockquote>
          `);
      });
      it('creates new block after quote from empty last block', () => {
        cy.clickQuoteButton()
          .type('foo')
          .enter()
          .enter()
          .confirmMarkdownEditorContent(`
            <blockquote>
              <p>foo</p>
            </blockquote>
            <p></p>
          `)
      });
    });
  });
});
