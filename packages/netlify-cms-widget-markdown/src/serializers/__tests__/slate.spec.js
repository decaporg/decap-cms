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
    expect(process('_`a`b_')).toEqual('*`a`b*');
    expect(process('_`a`_')).toEqual('*`a`*');
  });

  it('should condense adjacent, identically styled text and inline nodes', () => {
    expect(process('**a ~~b~~~~c~~**')).toEqual('**a ~~bc~~**');
    expect(process('**a ~~b~~~~[c](d)~~**')).toEqual('**a ~~b[c](d)~~**');
  });

  it('should handle nested markdown entities', () => {
    expect(process('**a**b**c**')).toEqual('**a**b**c**');
    expect(process('**a _b_ c**')).toEqual('**a *b* c**');
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
              text: 'foo ', // <--
              marks: [{ type: 'bold' }],
            },
            { object: 'text', text: 'bar ' },
            {
              object: 'text',
              text: 'foo ',
              marks: [{ type: 'bold' }],
            },
            {
              object: 'text',
              text: 'bar',
              marks: [{ type: 'bold' }, { type: 'italic' }],
            },
          ],
        },
      ],
    };
    expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"**foo** bar **foo *bar***"`);
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
            { object: 'text', text: 'foo' },
            {
              object: 'text',
              text: ' bar', // <--
              marks: [{ type: 'bold' }],
            },
          ],
        },
      ],
    };
    expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"foo **bar**"`);
  });

  describe('with nested styles within a single word', () => {
    it('should not produce invalid markdown when a bold word has italics applied to a smaller part', () => {
      const slateAst = {
        object: 'block',
        type: 'root',
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              { object: 'text', text: 'h', marks: [{ type: 'bold' }] },
              { object: 'text', text: 'e', marks: [{ type: 'bold' }, { type: 'italic' }] },
              { object: 'text', text: 'y', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      };
      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"**h*e*y**"`);
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
              { object: 'text', text: 'h', marks: [{ type: 'italic' }] },
              { object: 'text', text: 'e', marks: [{ type: 'italic' }, { type: 'bold' }] },
              { object: 'text', text: 'y', marks: [{ type: 'italic' }] },
            ],
          },
        ],
      };
      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"*h**e**y*"`);
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
              { object: 'text', text: 'h', marks: [{ type: 'strikethrough' }] },
              {
                object: 'text',
                text: 'e',
                marks: [{ type: 'strikethrough' }, { type: 'bold' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'strikethrough' }, { type: 'bold' }, { type: 'italic' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'strikethrough' }, { type: 'bold' }],
              },
              { object: 'text', text: 'o', marks: [{ type: 'strikethrough' }] },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"~~h**e*l*l**o~~"`);
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
              { object: 'text', text: 'h', marks: [{ type: 'strikethrough' }] },
              {
                object: 'text',
                text: 'e',
                marks: [{ type: 'strikethrough' }, { type: 'italic' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'strikethrough' }, { type: 'italic' }, { type: 'bold' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'strikethrough' }, { type: 'italic' }],
              },
              { object: 'text', text: 'o', marks: [{ type: 'strikethrough' }] },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"~~h*e**l**l*o~~"`);
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
              { object: 'text', text: 'h', marks: [{ type: 'bold' }] },
              { object: 'text', text: 'e', marks: [{ type: 'bold' }, { type: 'italic' }] },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'strikethrough' }],
              },
              { object: 'text', text: 'l', marks: [{ type: 'bold' }, { type: 'italic' }] },
              { object: 'text', text: 'o', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"**h*e~~l~~l*o**"`);
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
              { object: 'text', text: 'h', marks: [{ type: 'bold' }] },
              {
                object: 'text',
                text: 'e',
                marks: [{ type: 'bold' }, { type: 'strikethrough' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'bold' }, { type: 'strikethrough' }, { type: 'italic' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'bold' }, { type: 'strikethrough' }],
              },
              { object: 'text', text: 'o', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"**h~~e*l*l~~o**"`);
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
              { object: 'text', text: 'h', marks: [{ type: 'italic' }] },
              { object: 'text', text: 'e', marks: [{ type: 'italic' }, { type: 'bold' }] },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'italic' }, { type: 'bold' }, { type: 'strikethrough' }],
              },
              { object: 'text', text: 'l', marks: [{ type: 'italic' }, { type: 'bold' }] },
              { object: 'text', text: 'o', marks: [{ type: 'italic' }] },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"*h**e~~l~~l**o*"`);
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
              { object: 'text', text: 'h', marks: [{ type: 'italic' }] },
              {
                object: 'text',
                text: 'e',
                marks: [{ type: 'italic' }, { type: 'strikethrough' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'italic' }, { type: 'strikethrough' }, { type: 'bold' }],
              },
              {
                object: 'text',
                text: 'l',
                marks: [{ type: 'italic' }, { type: 'strikethrough' }],
              },
              { object: 'text', text: 'o', marks: [{ type: 'italic' }] },
            ],
          },
        ],
      };

      expect(slateToMarkdown(slateAst)).toMatchInlineSnapshot(`"*h~~e**l**l~~o*"`);
    });
  });
});
