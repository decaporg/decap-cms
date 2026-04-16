import path from 'path';
import fs from 'fs';
import { Map } from 'immutable';

import { markdownToSlate, htmlToSlate, slateToMarkdown } from '../';

describe('markdownToSlate', () => {
  it('should not add duplicate identical marks under the same node (GitHub Issue 3280)', () => {
    const mdast = fs.readFileSync(
      path.join(__dirname, '__fixtures__', 'duplicate_marks_github_issue_3280.md'),
    );
    const slate = markdownToSlate(mdast);

    expect(slate).toEqual([
      {
        type: 'p',
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

describe('slateToMarkdown', () => {
  it('should preserve hard line breaks created with trailing backslashes for Decap timeline text', () => {
    const slate = [
      {
        type: 'p',
        children: [
          { text: '2022', bold: true, marks: [{ type: 'bold' }] },
          { type: 'break', children: [{ text: '' }] },
          { text: 'Netlify CMS was renamed to Decap CMS.' },
        ],
      },
      {
        type: 'p',
        children: [
          { text: '2023', bold: true, marks: [{ type: 'bold' }] },
          { type: 'break', children: [{ text: '' }] },
          {
            text: 'The richtext widget added container editor components for richer editorial workflows.',
          },
        ],
      },
      {
        type: 'p',
        children: [
          { text: '2026', bold: true, marks: [{ type: 'bold' }] },
          { type: 'break', children: [{ text: '' }] },
          { text: 'Editors still expect hard line breaks to survive visual mode round-trips.' },
        ],
      },
    ];

    const markdown = slateToMarkdown(slate, {}, Map());

    expect(markdown).toBe(
      '**2022**\\\n' +
        'Netlify CMS was renamed to Decap CMS.\n\n' +
        '**2023**\\\n' +
        'The richtext widget added container editor components for richer editorial workflows.\n\n' +
        '**2026**\\\n' +
        'Editors still expect hard line breaks to survive visual mode round-trips.',
    );
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
          type: 'p',
          children: [
            { text: 'Bold Text', bold: true, marks: [{ type: 'bold' }] },
            { text: ' regular text' },
          ],
        },
      ],
    });
  });
});
