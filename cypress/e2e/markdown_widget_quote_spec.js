import '../utils/dismiss-local-backup';

describe('Markdown widget', () => {
  describe('quote block', () => {
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

    // describe('toggle quote', () => {
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
          .enter({ times: 2 }) // First Enter creates new list item. Second Enter turns that list item into a default block.
          .clickQuoteButton() // Unwrap the quote block.
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
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .setSelection('foo', 'bar')
          .wait(500)
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
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .setSelection('oo', 'ba')
          .wait(500)
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
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.focused()
          .clickUnorderedListButton()
          .type('foo')
          .enter()
          .type('bar')
          .setSelection('foo', 'bar')
          .wait(500)
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
          .wait(500)
          .enter()
          .type('baz')
          .setSelection('bar', 'baz')
          .wait(500)
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
          // Content should contains 4 <blockquote> tags and 3 <ul> tags
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
            </blockquote>
          `)
          /*
           * First Enter creates new paragraph within the innermost block quote.
           * Second Enter moves that paragraph one level up to become sibling of the previous quote block and direct child of a list item.
           * Third Enter to turn that paragraph into a list item and move it one level up.
           * Repeat the circle for three more times to reach the second list item of the outermost list block.
           * Then Enter again to turn that list item into a paragraph and move it one level up to become sibling of the outermost list and
           * direct child of the outermost block quote.
          */
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
          /* The GOAL is to delete all the text content inside this deeply nested block quote and turn it into a default paragraph block on top level.
           * We need:
           *  3 Backspace to delete the word “bar”.
           *  1 Backspace to remove the paragraph that contains bar and bring cursor to the end of the unordered list which is direct child of the outermost block quote.
           *  3 Backspace to remove the word “foo”.
           *  1 Backspace to remove the current block quote that the cursor is on, 1 Backspace to remove the list that wraps the block quote. Repeat this step for three times for a total of 6 Backspace until the cursor is on the outermost block quote.
           * 1 Backspace to remove to toggle off the outermost block quote and turn it into a default paragraph.
           * Total Backspaces required: 3 + 1 + 3 + ((1 + 1) * 3) + 1 = 14
          */
          .backspace({ times: 14 })
      });
    // });

    // describe('backspace inside quote', () => {
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
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.clickQuoteButton()
          .type('foo')
          .enter()
          .type('bar')
          .setCursorBefore('foo')
          .wait(500)
          .backspace()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <blockquote>
              <p>bar</p>
            </blockquote>
          `)
      });
    // });

    // describe('enter inside quote', () => {
      it('creates new block inside quote', () => {
        // eslint-disable-next-line cypress/no-unnecessary-waiting
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
          .wait(500)
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
    // });
  });
});
