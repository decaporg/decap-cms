import '../utils/dismiss-local-backup';

describe('Markdown widget', () => {
  describe('list', () => {
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

    describe('toolbar buttons', () => {
      it('creates and focuses empty list', () => {
        cy.clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('removes list', () => {
        cy.clickUnorderedListButton({ times: 2 })
          .confirmMarkdownEditorContent(`
            <p></p>
          `);
      });

      it('converts a list item to a paragraph block which is a sibling of the parent list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p></p>
          `)
      });

      it('converts empty nested list item to empty paragraph block in parent list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .tabkey()
          .type('bar')
          .enter()
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p></p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <p></p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .backspace({ times: 4 })
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('moves nested list item content to parent list item when in first block', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .tabkey()
          .type('bar')
          .enter()
          .tabkey()
          .type('baz')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <p>baz</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p>bar</p>
                <p>baz</p>
              </li>
            </ul>
          `)
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <p>bar</p>
            <p>baz</p>
          `);
      });

      it('affects only the current block with collapsed selection', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <ul>
              <li>
                <p>bar</p>
              </li>
            </ul>
            <p>baz</p>
          `);
      });

      it('wrap each bottom-most block in a selection with a list item block', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .setSelection('foo', 'baz')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
      })

      it('unwraps list item block from each selected list item and unwraps all of them from the outer list block', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .setSelection('foo', 'baz')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <p>bar</p>
            <p>baz</p>
          `)
      })
      
      it('combines adjacent same-typed lists, not differently typed lists', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .up()
          .clickUnorderedListButton()
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
            </ul>
            <p>baz</p>
          `)
          .down({ times: 2 })
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .up()
          .enter()
          .type('qux')
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ul>
                  <li>
                    <p>qux</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .up()
          .enter()
          .type('quux')
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ul>
                  <li>
                    <p>quux</p>
                  </li>
                  <li>
                    <p>qux</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .clickOrderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ol>
                  <li>
                    <p>quux</p>
                  </li>
                </ol>
                <ul>
                  <li>
                    <p>qux</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .setSelection({
            anchorQuery: 'ul > li > ol p',
            anchorOffset: 1,
            focusQuery: 'ul > li > ul:last-child p',
            focusOffset: 2,
          });
      });

      it('affects only selected list items', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .setSelection('bar')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p>bar</p>
            <ul>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .clickUnorderedListButton()
          .setSelection('bar', 'baz')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p>bar</p>
            <p>baz</p>
          `)
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .setSelection('baz')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
            </ul>
            <p>baz</p>
          `)
          .clickUnorderedListButton()
          .tabkey()
          .setCursorAfter('baz')
          .enter()
          .tabkey()
          .type('qux')
          .confirmMarkdownEditorContent(`
          <ul>
            <li>
              <p>foo</p>
            </li>
            <li>
              <p>bar</p>
              <ul>
                <li>
                  <p>baz</p>
                  <ul>
                    <li>
                      <p>qux</p>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>  
          `)
          .setSelection('baz')
          .clickOrderedListButton()
          .confirmMarkdownEditorContent(`
          <ul>
            <li>
              <p>foo</p>
            </li>
            <li>
              <p>bar</p>
              <ol>
                <li>
                  <p>baz</p>
                  <ul>
                    <li>
                      <p>qux</p>
                    </li>
                  </ul>
                </li>
              </ol>
            </li>
          </ul>  
          `)
          .setCursorAfter('qux')
          .enter({ times: 2 })
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ol>
                  <li>
                    <p>baz</p>
                    <ul>
                      <li>
                        <p>qux</p>
                      </li>
                    </ul>
                  </li>
                </ol>
                <ul>
                  <li>
                    <p></p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
      });
    });

    describe('on Enter', () => {
      it('removes the list item and list if empty', () => {
        cy.clickUnorderedListButton()
          .enter()
          .confirmMarkdownEditorContent(`
            <p></p>
          `);
      });

      it('creates a new list item in a non-empty list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p></p>
              </li>
            </ul>
          `)
          .type('bar')
          .enter()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
              <li>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('creates a new default block below a list when hitting Enter twice on an empty list item of the list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p></p>
          `);
      });
    });

    describe('on Backspace', () => {
      it('removes the list item and list if empty', () => {
        cy.clickUnorderedListButton()
          .backspace()
          .confirmMarkdownEditorContent(`
            <p></p>
          `);
      });

      it('removes the list item if list not empty', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .backspace()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('does not remove list item if empty with non-default block', () => {
        cy.clickUnorderedListButton()
          .clickHeadingOneButton()
          .backspace()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p></p>
              </li>
            </ul>
          `);
      });
    });

    describe('on Tab', () => {
      it('does nothing in top level list', () => {
        cy.clickUnorderedListButton()
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p></p>
              </li>
            </ul>
          `)
          .type('foo')
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
          `)
      });

      it('indents nested list items', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .type('bar')
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .enter()
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p></p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `)
      });

      it('only nests up to one level down from the parent list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p></p>
                  </li>
                </ul>
              </li>
            </ul>
          `);
      });

      it('unindents nested list items with shift', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .tabkey()
          .tabkey({ shift: true })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p></p>
              </li>
            </ul>
          `)
      });

      it('indents and unindents from one level below parent back to document root', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .tabkey()
          .type('bar')
          .enter()
          .tabkey()
          .type('baz')
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p>baz</p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .tabkey({ shift: true })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                  </li>
                  <li>
                    <p>baz</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .tabkey({ shift: true })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
      });
    });
  });
});
