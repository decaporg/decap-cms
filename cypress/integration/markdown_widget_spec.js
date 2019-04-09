import '../utils/dismiss-local-backup';

describe('Markdown widget', () => {
  describe('list', () => {
    before(() => {
      cy.loginAndNewPost();
    });

    beforeEach(() => {
      cy.get('[data-slate-editor]').type('{selectall}{backspace}{backspace}');
    });

    describe('toolbar buttons', () => {
      it('creates and focuses empty list', () => {
        cy.clickUnorderedListButton()
          .confirmEditorTree(`
            <ul>
              <li>
                <p>﻿<br></p>
              </li>
            </ul>
          `);
      });
    });

    describe('on Enter', () => {
      it('removes the list item and list if empty', () => {
        cy.clickUnorderedListButton()
          .type('{enter}')
          .confirmEditorTree(`
            <p>﻿<br></p>
          `);
      });

      it('creates a new paragraph in a non-empty paragraph within a list item', () => {
        cy.clickUnorderedListButton()
          .type('foo{enter}')
          .confirmEditorTree(`
            <ul>
              <li>
                <p>foo</p>
                <p>﻿<br></p>
              </li>
            </ul>
          `)
          .type('bar{enter}')
          .confirmEditorTree(`
            <ul>
              <li>
                <p>foo</p>
                <p>bar</p>
                <p>﻿<br></p>
              </li>
            </ul>
          `);
      });

      it('creates a new list item in an empty paragraph within a non-empty list item', () => {
        cy.clickUnorderedListButton()
          .type('foo{enter}{enter}')
          .confirmEditorTree(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>﻿<br></p>
              </li>
            </ul>
          `)
          .type('bar{enter}')
          .confirmEditorTree(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <p>﻿<br></p>
              </li>
            </ul>
          `);
      });
    });
  });
});
