import '../utils/dismiss-local-backup';

const empty = `﻿<br>`;

describe('Markdown widget', () => {
  before(() => {
    cy.loginAndNewPost();
  });

  beforeEach(() => {
    cy.clearMarkdownEditorContent();
  });

  describe('pressing backspace', () => {
    it('sets non-default block to default when empty', () => {
      cy.focused()
        .clickHeadingOneButton()
        .backspace()
        .confirmMarkdownEditorContent(`
          <p>${empty}</p>
        `);
    });
    it('does nothing at start of first block in document when non-empty and non-default', () => {
      cy.focused()
        .clickHeadingOneButton()
        .type('foo')
        .setCursorBefore('foo')
        .backspace({ times: 4 })
        .confirmMarkdownEditorContent(`
          <h1>foo</h1>
        `);
    });
    it('deletes individual characters in middle of non-empty non-default block in document', () => {
      cy.focused()
        .clickHeadingOneButton()
        .type('foo')
        .setCursorAfter('fo')
        .backspace({ times: 3 })
        .confirmMarkdownEditorContent(`
          <h1>o</h1>
        `);
    });
    it('at beginning of non-first block, moves default block content to previous block', () => {
      cy.focused()
        .clickHeadingOneButton()
        .type('foo')
        .enter()
        .type('bar')
        .setCursorBefore('bar')
        .backspace()
        .confirmMarkdownEditorContent(`
          <h1>foobar</h1>
        `);
    });
    it('at beginning of non-first block, moves non-default block content to previous block', () => {
      cy.focused()
        .type('foo')
        .enter()
        .clickHeadingOneButton()
        .type('bar')
        .enter()
        .clickHeadingTwoButton()
        .type('baz')
        .setCursorBefore('baz')
        .backspace()
        .confirmMarkdownEditorContent(`
          <p>foo</p>
          <h1>barbaz</h1>
        `)
        .setCursorBefore('bar')
        .backspace()
        .confirmMarkdownEditorContent(`
          <p>foobarbaz</p>
        `);
    });
  });
});
