import path from 'path';
import fs from 'fs';

import { markdownToSlate, htmlToSlate } from '../';

describe('markdownToSlate', () => {
  it('should not add duplicate identical marks under the same node (GitHub Issue 3280)', () => {
    const mdast = fs.readFileSync(
      path.join(__dirname, '__fixtures__', 'duplicate_marks_github_issue_3280.md'),
    );
    const slate = markdownToSlate(mdast);

    expect(slate).toEqual([
      {
        type: 'paragraph',
        children: [
          {
            text: 'Fill to',
          },
          {
            italic: true,
            marks: [{ type: 'italic' }],
            text: 'this_mark, and your charge is but a penny; tothisa penny more; and so on to the full glass—the Cape Horn measure, which you may gulp down for a shilling.\\n\\nUpon entering the place I found a number of young seamen gathered about a table, examining by a dim light divers specimens ofskrimshander',
          },
          {
            text: '.',
          },
        ],
      },
    ]);
  });
});

describe('htmlToSlate', () => {
  it('should preserve spaces in rich html (GitHub Issue 3727)', () => {
    const html = `<strong>Bold Text</strong><span><span> </span>regular text<span> </span></span>`;

    const actual = htmlToSlate(html);
    expect(actual).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { text: 'Bold Text', bold: true, marks: [{ type: 'bold' }] },
            { text: ' regular text' },
          ],
        },
      ],
    });
  });
});
