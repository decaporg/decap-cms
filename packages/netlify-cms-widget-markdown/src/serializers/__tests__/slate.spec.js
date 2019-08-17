import { flow } from 'lodash';
import { markdownToSlate, slateToMarkdown } from '../index';

const process = flow([markdownToSlate, slateToMarkdown]);

describe('slate', () => {
  it('should not decode encoded html entities in inline code', () => {
    expect(process('<code>&lt;div&gt;</code>')).toEqual('<code>&lt;div&gt;</code>');
  });

  it('should parse non-text children of mark nodes', () => {
    expect(process('**a[b](c)d**')).toEqual('**a[b](c)d**');
    expect(process('**[a](b)**')).toEqual('**[a](b)**');
    expect(process('**![a](b)**')).toEqual('**![a](b)**');
    expect(process('_`a`_')).toEqual('_`a`_');
    expect(process('_`a`b_')).toEqual('_`a`b_');
  });

  it('should condense adjacent, identically styled text and inline nodes', () => {
    expect(process('**a ~~b~~~~c~~**')).toEqual('**a ~~bc~~**');
    expect(process('**a ~~b~~~~[c](d)~~**')).toEqual('**a ~~b[c](d)~~**');
  });

  it('should handle nested markdown entities', () => {
    expect(process('**a**b**c**')).toEqual('**a**b**c**');
    expect(process('**a _b_ c**')).toEqual('**a _b_ c**');
  });

  it('should parse inline images as images', () => {
    expect(process('a ![b](c)')).toEqual('a ![b](c)');
  });

  it('should not escape markdown entities in html', () => {
    expect(process('<span>*</span>')).toEqual('<span>*</span>');
  });

  it('should not produce invalid markdown when a styled block has trailing whitespace', () => {
    const slateAst = {
      object: 'block',
      type: 'root',
      nodes: [
        {
          object: 'block',
          type: 'paragraph',
          nodes: [
            {
              object: 'text',
              data: undefined,
              leaves: [
                {
                  text: 'foo ', // <--
                  marks: [{ type: 'bold' }],
                },
              ],
            },
            { object: 'text', data: undefined, leaves: [{ text: 'bar' }] },
          ],
        },
      ],
    };
    expect(slateToMarkdown(slateAst)).toEqual('**foo** bar');
  });

  it('should not produce invalid markdown when a styled block has leading whitespace', () => {
    const slateAst = {
      object: 'block',
      type: 'root',
      nodes: [
        {
          object: 'block',
          type: 'paragraph',
          nodes: [
            { object: 'text', data: undefined, leaves: [{ text: 'foo' }] },
            {
              object: 'text',
              data: undefined,
              leaves: [
                {
                  text: ' bar', // <--
                  marks: [{ type: 'bold' }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(slateToMarkdown(slateAst)).toEqual('foo **bar**');
  });

  describe.skip('with nested styles within a single word', () => {
    it('should not produce invalid markdown when a bold word has italics applied to a smaller part', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'bold' }] },
                  { text: 'e', marks: [{ type: 'bold' }, { type: 'italic' }] },
                  { text: 'y', marks: [{ type: 'bold' }] },
                ],
              },
            ],
          },
        ],
      };
      expect(slateToMarkdown(slateAst)).toEqual('**h**_**e**_**y**');
    });

    it('should not produce invalid markdown when an italic word has bold applied to a smaller part', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'italic' }] },
                  { text: 'e', marks: [{ type: 'italic' }, { type: 'bold' }] },
                  { text: 'y', marks: [{ type: 'italic' }] },
                ],
              },
            ],
          },
        ],
      };
      expect(slateToMarkdown(slateAst)).toEqual('_h**_e_**y_');
    });

    it('should not produce invalid markdown when an italic word has bold applied to a smaller part', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'italic' }] },
                  { text: 'e', marks: [{ type: 'italic' }, { type: 'bold' }] },
                  { text: 'y', marks: [{ type: 'italic' }] },
                ],
              },
            ],
          },
        ],
      };
      expect(slateToMarkdown(slateAst)).toEqual('_h**_e_**y_');
    });

    it('should handle italics inside bold inside strikethrough', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'strikethrough' }] },
                  {
                    text: 'e',
                    marks: [{ type: 'strikethrough' }, { type: 'bold' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'strikethrough' }, { type: 'bold' }, { type: 'italic' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'strikethrough' }, { type: 'bold' }],
                  },
                  { text: 'o', marks: [{ type: 'strikethrough' }] },
                ],
              },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toEqual('~~h~~**~~e~~**_~~**l**~~_**~~l~~**~~o~~');
    });

    it('should handle bold inside italics inside strikethrough', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'strikethrough' }] },
                  {
                    text: 'e',
                    marks: [{ type: 'strikethrough' }, { type: 'italic' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'strikethrough' }, { type: 'italic' }, { type: 'bold' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'strikethrough' }, { type: 'italic' }],
                  },
                  { text: 'o', marks: [{ type: 'strikethrough' }] },
                ],
              },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toEqual('~~h~~_~~e~~_**_~~l~~_**_~~l~~_~~o~~');
    });

    it('should handle strikethrough inside italics inside bold', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'bold' }] },
                  { text: 'e', marks: [{ type: 'bold' }, { type: 'italic' }] },
                  {
                    text: 'l',
                    marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'strikethrough' }],
                  },
                  { text: 'l', marks: [{ type: 'bold' }, { type: 'italic' }] },
                  { text: 'o', marks: [{ type: 'bold' }] },
                ],
              },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toEqual('**h**_**e**_~~**_l_**~~_**l**_**o**');
    });

    it('should handle italics inside strikethrough inside bold', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'bold' }] },
                  {
                    text: 'e',
                    marks: [{ type: 'bold' }, { type: 'strikethrough' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'bold' }, { type: 'strikethrough' }, { type: 'italic' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'bold' }, { type: 'strikethrough' }],
                  },
                  { text: 'o', marks: [{ type: 'bold' }] },
                ],
              },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toEqual('**h**~~**e**~~_~~**l**~~_~~**l**~~**o**');
    });

    it('should handle strikethrough inside bold inside italics', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'italic' }] },
                  { text: 'e', marks: [{ type: 'italic' }, { type: 'bold' }] },
                  {
                    text: 'l',
                    marks: [{ type: 'italic' }, { type: 'bold' }, { type: 'strikethrough' }],
                  },
                  { text: 'l', marks: [{ type: 'italic' }, { type: 'bold' }] },
                  { text: 'o', marks: [{ type: 'italic' }] },
                ],
              },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toEqual('_h_**_e_**~~**_l_**~~**_l_**_o_');
    });

    it('should handle bold inside strikethrough inside italics', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                data: undefined,
                leaves: [
                  { text: 'h', marks: [{ type: 'italic' }] },
                  {
                    text: 'e',
                    marks: [{ type: 'italic' }, { type: 'strikethrough' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'italic' }, { type: 'strikethrough' }, { type: 'bold' }],
                  },
                  {
                    text: 'l',
                    marks: [{ type: 'italic' }, { type: 'strikethrough' }],
                  },
                  { text: 'o', marks: [{ type: 'italic' }] },
                ],
              },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toEqual('_h_~~_e_~~**_~~l~~_**~~_l_~~_o_');
    });
  });
});
