import { flow, trim } from 'lodash';
import { stripIndent, source } from 'common-tags';
import { tests as commonmarkSpec } from 'commonmark-spec';
import commonmark from 'commonmark';
import { markdownToSlate, slateToMarkdown, markdownToHtml } from '../index.js';

const skips = [
  {
    number: [416, 417, 424, 425, 426, 431],
    reason: 'Remark does not support infinite (redundant) nested marks',
  },
  { number: 602, reason: 'Remark allows autolink emails to contain backslashes' },
  { number: 599, reason: 'Remark does not escape all expected entities' },
  { number: 593, reason: 'Remark removes "mailto:" from autolink text' },
  { number: 589, reason: 'Remark does not honor backslash escape of image exclamation point' },
  {
    number: [569, 570, 571, 572, 573, 581, 585],
    reason: 'Remark does not recognize or remove marks in image alt text',
  },
];

const onlys = [
  // just add the spec number, eg:
  // 431,
];

/**
 * Each test receives input markdown and output html as expected for Commonmark
 * compliance. To test all of our handling in one go, we serialize the markdown
 * into our Slate AST, then back to raw markdown, and finally to HTML.
 */
const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();
const parseWithCommonmark = markdown => {
  const parsed = reader.parse(markdown);
  return writer.render(parsed);
};
const parse = flow([markdownToSlate, slateToMarkdown]);

/**
 * Passing this test suite requires 100% Commonmark compliance. There are 624
 * tests, of which we're passing about 300 as of introduction of this suite. To
 * work on improving Commonmark support, update __fixtures__/commonmarkExpected.json
 */
describe('Commonmark support', function() {
  const specs = onlys.length > 0
    ? commonmarkSpec.filter(({ number }) => onlys.includes(number))
    : commonmarkSpec;
  specs.forEach(spec => {
    const skip = skips.find(({ number }) => {
      return Array.isArray(number) ? number.includes(spec.number) : number === spec.number;
    });
    const specUrl = `https://spec.commonmark.org/0.29/#example-${spec.number}`;
    const parsed = parse(spec.markdown);
    const commonmarkParsedHtml = parseWithCommonmark(parsed);
    const description =`
${spec.section}
${specUrl}

Spec:
${JSON.stringify(spec, null, 2)}

Markdown input:
${spec.markdown}

Markdown parsed through Slate/Remark and back to Markdown:
${parsed}

HTML output:
${commonmarkParsedHtml}

Expected HTML output:
${spec.html}
    `;
    if (skip) {
      const showMessage = Array.isArray(skip.number) ? skip.number[0] === spec.number : true;
      if (showMessage) {
        console.log(`skipping spec ${skip.number} because ${skip.reason}.\n${specUrl}`);
      }
    }
    const testFn = skip ? test.skip : test;
    testFn(description, () => {
      expect(commonmarkParsedHtml).toEqual(spec.html);
    });
  });
});
