import '../utils/dismiss-local-backup';

describe('Markdown widget breaks', () => {
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

  describe('pressing enter', () => {
    it('creates new default block from empty block', () => {
      cy.focused()
        .enter()
        .confirmMarkdownEditorContent(`
          <p></p>
          <p></p>
        `);
    });
    it('creates new default block when selection collapsed at end of block', () => {
      cy.focused()
        .type('foo')
        .enter()
        .confirmMarkdownEditorContent(`
          <p>foo</p>
          <p></p>
        `);
    });
    it('creates new default block when selection collapsed at end of non-default block', () => {
      cy.clickHeadingOneButton()
        .type('foo')
        .enter()
        .confirmMarkdownEditorContent(`
          <h1>foo</h1>
          <p></p>
        `);
    });
    it('creates new default block when selection collapsed in empty non-default block', () => {
      cy.clickHeadingOneButton()
        .enter()
        .confirmMarkdownEditorContent(`
          <h1></h1>
          <p></p>
        `);
    });
    it('splits block into two same-type blocks when collapsed selection at block start', () => {
      cy.clickHeadingOneButton()
        .type('foo')
        .setCursorBefore('foo')
        .enter()
        .confirmMarkdownEditorContent(`
          <h1></h1>
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

  describe('pressing shift+enter', () => {
    it('creates line break', () => {
      cy.focused()
        .enter({ shift: true })
        .confirmMarkdownEditorContent(`
          <p>
            <br>
          </p>
        `);
    });
    it('creates consecutive line break', () => {
      cy.focused()
        .enter({ shift: true, times: 4 })
        .confirmMarkdownEditorContent(`
          <p>
            <br>
            <br>
            <br>
            <br>
          </p>
        `);
    });
  });
});
