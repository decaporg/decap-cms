/** @jsx h */

import flow from 'lodash/flow';

import h from '../../../test-helpers/h';
import { markdownToSlate, slateToMarkdown } from '../index';

const process = flow([markdownToSlate, slateToMarkdown]);

describe('slate', () => {
  it('should not decode encoded html entities in inline code', () => {
    expect(process('<element type="code">&lt;div&gt;</element>')).toEqual(
      '<element type="code">&lt;div&gt;</element>',
    );
  });

  it('should parse non-text children of mark nodes', () => {
    expect(process('**a[b](c)d**')).toEqual('**a[b](c)d**');
    expect(process('**[a](b)**')).toEqual('**[a](b)**');
    expect(process('**![a](b)**')).toEqual('**![a](b)**');
    expect(process('_`a`_')).toEqual('*`a`*');
  });

  it('should handle unstyled code nodes adjacent to styled code nodes', () => {
    expect(process('`foo`***`bar`***')).toEqual('`foo`***`bar`***');
  });

  it('should handle styled code nodes adjacent to non-code text', () => {
    expect(process('_`a`b_')).toEqual('*`a`b*');
    expect(process('_`a`**b**_')).toEqual('*`a`**b***');
  });

  it('should condense adjacent, identically styled text and inline nodes', () => {
    expect(process('**a ~~b~~~~c~~**')).toEqual('**a ~~bc~~**');
    expect(process('**a ~~b~~~~[c](d)~~**')).toEqual('**a ~~b[c](d)~~**');
  });

  it('should handle nested markdown entities', () => {
    expect(process('**a**b**c**')).toEqual('**a**b**c**');
    expect(process('**a _b_ c**')).toEqual('**a *b* c**');
    expect(process('*`a`*')).toEqual('*`a`*');
  });

  it('should parse inline images as images', () => {
    expect(process('a ![b](c)')).toEqual('a ![b](c)');
  });

  it('should not escape markdown entities in html', () => {
    expect(process('<span>*</span>')).toEqual('<span>*</span>');
  });

  it('should wrap break tags in surrounding marks', () => {
    expect(process('*a  \nb*')).toEqual('*a\\\nb*');
  });

  // slateAst no longer valid

  it('should not output empty headers in markdown', () => {
    // prettier-ignore
    const slateAst = (
      <editor>
        <element type="heading-one"></element>
        <element type="paragraph">foo</element>
        <element type="heading-one"></element>

      </editor>
    );
    expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"foo"`);
  });

  it('should not output empty marks in markdown', () => {
    // prettier-ignore
    const slateAst = (
      <editor>
        <element type="paragraph">
          <text bold></text>
          foo<text italic><text bold></text></text>bar
          <text bold></text>baz<text italic></text>
        </element>
      </editor>
    );
    expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"foobarbaz"`);
  });

  it('should not produce invalid markdown when a styled block has trailing whitespace', () => {
    // prettier-ignore
    const slateAst = (
      <editor>
        <element type="paragraph">
          <text bold>foo </text>bar <text bold>bim </text><text bold><text italic>bam</text></text>
        </element>
      </editor>
    );
    expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"**foo** bar **bim *bam***"`);
  });

  it('should not produce invalid markdown when a styled block has leading whitespace', () => {
    // prettier-ignore
    const slateAst = (
      <editor>
        <element type="paragraph">
          foo<text bold> bar</text>
        </element>
      </editor>
    );
    expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"foo **bar**"`);
  });

  it('should group adjacent marks into a single mark when possible', () => {
    // prettier-ignore
    const slateAst = (
      <editor>
        <element type="paragraph">
          <text bold>shared mark</text>
          <element type="link" data={{ url: "link" }}>
            <text bold><text italic>link</text></text>
          </element>
          {' '}
          <text bold>not shared mark</text>
          <element type="link" data={{ url: "link" }}>
            <text italic>another </text>
            <text bold><text italic>link</text></text>
          </element>
        </element>
      </editor>
    );
    expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(
      `"**shared mark*[link](link)*** **not shared mark***[another **link**](link)*"`,
    );
  });

  describe('links', () => {
    it('should handle inline code in link content', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <element type="link" data={{ url: "link" }}>
              <text code>foo</text>
            </element>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"[\`foo\`](link)"`);
    });
  });

  describe('code marks', () => {
    it('can contain other marks', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text code><text italic><text bold>foo</text></text></text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"***\`foo\`***"`);
    });

    it('can be condensed when no other marks are present', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
          <text code>foo</text>
          <text code>bar</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"\`foo\`"`);
    });
  });

  describe('with nested styles within a single word', () => {
    it('should not produce invalid markdown when a bold word has italics applied to a smaller part', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text bold>h</text>
            <text bold><text italic>e</text></text>
            <text bold>y</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"**h*e*y**"`);
    });

    it('should not produce invalid markdown when an italic word has bold applied to a smaller part', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text italic>h</text>
            <text italic><text bold>e</text></text>
            <text italic>y</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"*h**e**y*"`);
    });

    it('should handle italics inside bold inside strikethrough', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text delete>h</text>
            <text delete><text bold>e</text></text>
            <text delete><text bold><text italic>l</text></text></text>
            <text delete><text bold>l</text></text>
            <text delete>o</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"~~h**e*l*l**o~~"`);
    });

    it('should handle bold inside italics inside strikethrough', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text delete>h</text>
            <text delete><text italic>e</text></text>
            <text delete><text italic><text bold>l</text></text></text>
            <text delete><text italic>l</text></text>
            <text delete>o</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"~~h*e**l**l*o~~"`);
    });

    it('should handle strikethrough inside italics inside bold', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text bold>h</text>
            <text bold><text italic>e</text></text>
            <text bold><text italic><text delete>l</text></text></text>
            <text bold><text italic>l</text></text>
            <text bold>o</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"**h*e~~l~~l*o**"`);
    });

    it('should handle italics inside strikethrough inside bold', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text bold>h</text>
            <text bold><text delete>e</text></text>
            <text bold><text delete><text italic>l</text></text></text>
            <text bold><text delete>l</text></text>
            <text bold>o</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"**h~~e*l*l~~o**"`);
    });

    it('should handle strikethrough inside bold inside italics', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text italic>h</text>
            <text italic><text bold>e</text></text>
            <text italic><text bold><text delete>l</text></text></text>
            <text italic><text bold>l</text></text>
            <text italic>o</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"*h**e~~l~~l**o*"`);
    });

    it('should handle bold inside strikethrough inside italics', () => {
      // prettier-ignore
      const slateAst = (
        <editor>
          <element type="paragraph">
            <text italic>h</text>
            <text italic><text delete>e</text></text>
            <text italic><text delete><text bold>l</text></text></text>
            <text italic><text delete>l</text></text>
            <text italic>o</text>
          </element>
        </editor>
      );
      expect(slateToMarkdown(slateAst.children)).toMatchInlineSnapshot(`"*h~~e**l**l~~o*"`);
    });
  });
});
