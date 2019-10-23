import { flow, trim } from 'lodash';
import commonmarkSpec from './__fixtures__/commonmark.json';
import expected from './__fixtures__/commonmarkExpected.json';
import { markdownToSlate, slateToMarkdown, markdownToHtml } from '../index.js';

/**
 * Map the commonmark spec data into an array of arrays for use in Jest's
 * `test.each`.
 */
const spec = commonmarkSpec.map(({ markdown, html }) => [markdown, html]);

/**
 * Each test receives input markdown and output html as expected for Commonmark
 * compliance. To test all of our handling in one go, we serialize the markdown
 * into our Slate AST, then back to raw markdown, and finally to HTML.
 */
const process = flow([markdownToSlate, slateToMarkdown, markdownToHtml]);

/**
 * Passing this test suite requires 100% Commonmark compliance. There are 624
 * tests, of which we're passing about 300 as of introduction of this suite. To
 * work on improving Commonmark support, update __fixtures__/commonmarkExpected.json
 */

describe('Commonmark support', () => {
  test.each(spec)('%s', (markdown, html) => {
    // We're trimming the html from the spec as they all have trailing newlines
    // and we never output trailing newlines. This may be a compliance issue.
    const trimmedHtml = trim(html);

    switch (expected[markdown]) {
      case 'TO_EQUAL':
        expect(process(markdown)).toEqual(trimmedHtml);
        break;
      case 'NOT_TO_EQUAL':
        expect(process(markdown)).not.toEqual(trimmedHtml);
        break;
      case 'TO_ERROR':
        expect(() => process(markdown)).toThrowError();
        break;
      default:
        throw new Error('Unknown expected type: ' + expected[markdown]);
    }
  });
});
