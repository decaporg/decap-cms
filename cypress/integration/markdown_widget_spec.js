import '../utils/dismiss-local-backup';

const empty = `﻿<br>`;

describe('Markdown widget', () => {
  describe('list', () => {
    before(() => {
      cy.loginAndNewPost();
    });

    beforeEach(() => {
      cy.get('[data-slate-editor]')
        .selectAll()
        .backspace({ times: 2 })
    });

    describe('toolbar buttons', () => {
      it('creates and focuses empty list', () => {
        cy.clickUnorderedListButton()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>${empty}</p>
              </li>
            </ul>
          `);
      });

      it('removes list', () => {
        cy.clickUnorderedListButton({ times: 2 })
          .confirmEditorContent(`
            <p>${empty}</p>
          `);
      });

      it('creates nested list when selection is collapsed in non-first block of list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .clickUnorderedListButton()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>${empty}</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .type('bar')
          .enter()
          .clickUnorderedListButton()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p>${empty}</p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `);
      });

      it('converts empty nested list item to empty block in parent list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .clickUnorderedListButton()
          .type('bar')
          .enter()
          .clickUnorderedListButton()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p>${empty}</p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .clickUnorderedListButton()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <p>${empty}</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .backspace({ times: 4 })
          .clickUnorderedListButton()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p>${empty}</p>
              </li>
            </ul>
          `);
      });

      it('moves nested list item content to parent list item when in first block', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .clickUnorderedListButton()
          .type('bar')
          .enter()
          .clickUnorderedListButton()
          .type('baz')
          .clickUnorderedListButton()
          .confirmEditorContent(`
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
          .confirmEditorContent(`
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
          .confirmEditorContent(`
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
          .confirmEditorContent(`
            <p>foo</p>
            <ul>
              <li>
                <p>bar</p>
              </li>
            </ul>
            <p>baz</p>
          `);
      });

      it('combines adjacent same-typed lists', () => {
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
          .confirmEditorContent(`
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
          .confirmEditorContent(`
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
          .clickUnorderedListButton()
          .confirmEditorContent(`
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
          .clickUnorderedListButton()
          .confirmEditorContent(`
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
      });
    });

    describe('on Enter', () => {
      it('removes the list item and list if empty', () => {
        cy.clickUnorderedListButton()
          .enter()
          .confirmEditorContent(`
            <p>${empty}</p>
          `);
      });

      it('creates a new paragraph in a non-empty paragraph within a list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p>${empty}</p>
              </li>
            </ul>
          `)
          .type('bar')
          .enter()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p>bar</p>
                <p>${empty}</p>
              </li>
            </ul>
          `);
      });

      it('creates a new list item in an empty paragraph within a non-empty list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>${empty}</p>
              </li>
            </ul>
          `)
          .type('bar')
          .enter()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <p>${empty}</p>
              </li>
            </ul>
          `);
      });

      it('creates a new block below list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 3 })
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p>${empty}</p>
          `);
      });
    });

    describe('on Backspace', () => {
      it('removes the list item and list if empty', () => {
        cy.clickUnorderedListButton()
          .backspace()
          .confirmEditorContent(`
            <p>${empty}</p>
          `);
      });

      it('removes empty block in non-empty list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .backspace()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
          `);
      });

      it('removes the list item if list not empty', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .backspace()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p>${empty}</p>
              </li>
            </ul>
          `);
      });
    });

    describe('on Tab', () => {
      it('does nothing in top level list', () => {
        cy.clickUnorderedListButton()
          .tab()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>${empty}</p>
              </li>
            </ul>
          `)
          .type('foo')
          .tab()
          .confirmEditorContent(`
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
          .enter({ times: 2 })
          .type('bar')
          .tab()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>${empty}</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .enter({ times: 2 })
          .tab()
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>${empty}</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
      });

      it('only nests up to one level down from the parent list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .tab({ times: 5 })
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>${empty}</p>
                  </li>
                </ul>
              </li>
            </ul>
          `);
      });

      it('unindents nested list items with shift', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .tab()
          .tab({ shift: true })
          .confirmEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>${empty}</p>
              </li>
            </ul>
          `)
      });

      it.only('indents and unindents from one level below parent back to document root', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .tab()
          .type('bar')
          .enter({ times: 2 })
          .tab()
          .type('baz')
          .tab({ shift: true, times: 3 })
      });
    });
  });
});
