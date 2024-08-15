import { oneLineTrim, stripIndent } from 'common-tags';
import '../utils/dismiss-local-backup';

describe('Markdown widget code block', () => {
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
  describe('code block', () => {
    it('outputs code', () => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy
        .insertCodeBlock()
        .type('foo')
        .enter()
        .type('bar')
        .confirmMarkdownEditorContent(
          `
          ${codeBlock(`
            foo
            bar
          `)}
        `,
        )
        .wait(500)
        .clickModeToggle().confirmMarkdownEditorContent(`
          ${codeBlockRaw(`
            foo
            bar
          `)}
        `);
    });
  });
});

function codeBlockRaw(content) {
  return ['```', ...stripIndent(content).split('\n'), '```']
    .map(
      line => oneLineTrim`
    <div>
      <span>
        <span>
          <span>${line}</span>
        </span>
      </span>
    </div>
  `,
    )
    .join('');
}

function codeBlock(content) {
  const lines = stripIndent(content)
    .split('\n')
    .map(
      (line, idx) => `
    <div>
      <div>
        <div>${idx + 1}</div>
      </div>
      <pre><span>${line}</span></pre>
    </div>
  `,
    )
    .join('');

  return oneLineTrim`
    <div>
      <div></div>
      <div>
        <div>
          <div><label>Code Block</label></div>
          <div><button><span><svg>
                  <path></path>
                </svg></span></button>
            <div>
              <div>
                <div><textarea></textarea></div>
                <div>
                  <div></div>
                </div>
                <div>
                  <div></div>
                </div>
                <div></div>
                <div></div>
                <div>
                  <div>
                    <div>
                      <div>
                        <div>
                          <div>
                            <pre><span>xxxxxxxxxx</span></pre>
                          </div>
                          <div></div>
                          <div></div>
                          <div>
                            <div> </div>
                          </div>
                          <div>
                            ${lines}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div></div>
                  <div>
                    <div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
            <span>
                <span>
                    <span>﻿</span>
                </span>
            </span>
        </div>
      </div>
      <div></div>
    </div>
  `;
}
