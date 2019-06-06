import '../utils/dismiss-local-backup';

const empty = `﻿<br>`;

describe('Markdown widget breaks', () => {
  before(() => {
    cy.loginAndNewPost();
  });

  beforeEach(() => {
    cy.clearMarkdownEditorContent();
  });

  describe('pressing enter', () => {
    it('creates new default block from empty block', () => {
      cy.focused()
        .enter()
        .confirmMarkdownEditorContent(`
          <p>${empty}</p>
          <p>${empty}</p>
        `);
    });
    it('creates new default block when selection collapsed at end of block', () => {
      cy.focused()
        .type('foo')
        .enter()
        .confirmMarkdownEditorContent(`
          <p>foo</p>
          <p>${empty}</p>
        `);
    });
    it('creates new default block when selection collapsed at end of non-default block', () => {
      cy.clickHeadingOneButton()
        .type('foo')
        .enter()
        .confirmMarkdownEditorContent(`
          <h1>foo</h1>
          <p>${empty}</p>
        `);
    });
    it('creates new default block when selection collapsed in empty non-default block', () => {
      cy.clickHeadingOneButton()
        .enter()
        .confirmMarkdownEditorContent(`
          <h1>${empty}</h1>
          <p>${empty}</p>
        `);
    });
    it('splits block into two same-type blocks when collapsed selection at block start', () => {
      cy.clickHeadingOneButton()
        .type('foo')
        .setCursorBefore('foo')
        .enter()
        .confirmMarkdownEditorContent(`
          <h1>${empty}</h1>
          <h1>foo</h1>
        `);
    });
    it('splits block into two same-type blocks when collapsed in middle of selection at block start', () => {
      cy.clickHeadingOneButton()
        .type('foo')
        .setCursorBefore('oo')
        .enter()
        .confirmMarkdownEditorContent(`
          <h1>f</h1>
          <h1>oo</h1>
        `);
    });
    it('deletes selected content and splits to same-type block when selection is expanded', () => {
      cy.clickHeadingOneButton()
        .type('foo bar')
        .setSelection('o b')
        .enter()
        .confirmMarkdownEditorContent(`
          <h1>fo</h1>
          <h1>ar</h1>
        `);
    });
  });
});
