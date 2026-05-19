import '../utils/dismiss-local-backup';
import {HOT_KEY_MAP} from "../utils/constants";
const headingNumberToWord = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
const isMac = Cypress.platform === 'darwin';
const modifierKey = isMac ? '{meta}' : '{ctrl}';
// eslint-disable-next-line func-style
const replaceMod = (str) => str.replace(/mod\+/g, modifierKey).replace(/shift\+/g, '{shift}');

describe('Markdown widget hotkeys', () => {
  describe('hot keys', () => {
    before(() => {
      Cypress.config('defaultCommandTimeout', 4000);
      cy.task('setupBackend', { backend: 'test' });
    });

    beforeEach(() => {
      cy.loginAndNewPost();
      cy.clearMarkdownEditorContent();
      cy.focused()
        .type('foo')
        .setSelection('foo').as('selection');
    });

    after(() => {
      cy.task('teardownBackend', { backend: 'test' });
    });

    describe('bold', () => {
      it('pressing mod+b bolds the text', () => {
        cy.get('@selection')
          .type(replaceMod(HOT_KEY_MAP['bold']))
          .confirmMarkdownEditorContent(`
            <p>
              <strong>foo</strong>
            </p>
          `)
          .type(replaceMod(HOT_KEY_MAP['bold']));
      });
    });

    describe('italic', () => {
      it('pressing mod+i italicizes the text', () => {
        cy.get('@selection')
          .type(replaceMod(HOT_KEY_MAP['italic']))
          .confirmMarkdownEditorContent(`
            <p>
              <em>foo</em>
            </p>
          `)
          .type(replaceMod(HOT_KEY_MAP['italic']));
      });
    });

    describe('strikethrough', () => {
      it('pressing mod+shift+s displays a strike through the text', () => {
        cy.get('@selection')
          .type(replaceMod(HOT_KEY_MAP['strikethrough']))
          .confirmMarkdownEditorContent(`
            <p>
              <s>foo</s>
            </p>
          `).type(replaceMod(HOT_KEY_MAP['strikethrough']));
      });
    });

    describe('code', () => {
      it('pressing mod+shift+c displays a code block around the text', () => {
        cy.get('@selection')
          .type(replaceMod(HOT_KEY_MAP['code']))
          .confirmMarkdownEditorContent(`
            <p>
              <code>foo</code>
            </p>
          `).type(replaceMod(HOT_KEY_MAP['code']));
      });
    });

    describe('link', () => {
      before(() => {

      });
      it('pressing mod+k transforms the text to a link', () => {
        cy.window().then((win) => {
          cy.get('@selection')
          .type(replaceMod(HOT_KEY_MAP['link']))
          cy.stub(win, 'prompt').returns('https://google.com');
          cy.confirmMarkdownEditorContent('<p><a>foo</a></p>')
          .type(replaceMod(HOT_KEY_MAP['link']));
        });


      });
    });

    describe('headings', () => {
      for (let i = 1; i <= 6; i++) {
        it(`pressing mod+${i} transforms the text to a heading`, () => {
            cy.get('@selection')
              .type(replaceMod(HOT_KEY_MAP[`heading-${headingNumberToWord[i]}`]))
              .confirmMarkdownEditorContent(`<h${i}>foo</h${i}>`)
              .type(replaceMod(HOT_KEY_MAP[`heading-${headingNumberToWord[i]}`]))
        });
      }
    });
  });
});
