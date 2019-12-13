/** @jsx h */

import { flow } from 'lodash';
import h from '../../../test-helpers/h';
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

  it('should not output empty headers in markdown', () => {
    // prettier-ignore
    const slateAst = (
      <document>
        <heading-one></heading-one>
        <paragraph>foo</paragraph>
        <heading-one></heading-one>
      </document>
    );
    expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"foo"`);
  });

  it('should not output empty marks in markdown', () => {
    // prettier-ignore
    const slateAst = (
      <document>
        <paragraph>
          <b></b>
          foo<i><b></b></i>bar
          <b></b>baz<i></i>
        </paragraph>
      </document>
    );
    expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"foobarbaz"`);
  });

  it('should not produce invalid markdown when a styled block has trailing whitespace', () => {
    // prettier-ignore
    const slateAst = (
      <document>
        <paragraph>
          <b>foo </b>bar <b>bim </b><b><i>bam</i></b>
        </paragraph>
      </document>
    );
    expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"**foo** bar **bim *bam***"`);
  });

  it('should not produce invalid markdown when a styled block has leading whitespace', () => {
    // prettier-ignore
    const slateAst = (
      <document>
        <paragraph>
          foo<b> bar</b>
        </paragraph>
      </document>
    );
    expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"foo **bar**"`);
  });

  it('should group adjacent marks into a single mark when possible', () => {
    // prettier-ignore
    const slateAst = (
      <document>
        <paragraph>
          <b>shared mark</b>
          <link url="link">
            <b><i>link</i></b>
          </link>
          {' '}
          <b>not shared mark</b>
          <link url="link">
            <i>another </i>
            <b><i>link</i></b>
          </link>
        </paragraph>
      </document>
    );
    expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(
      `"**shared mark*[link](link)*** **not shared mark***[another **link**](link)*"`,
    );
  });

  describe('links', () => {
    it('should handle inline code in link content', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <link url="link">
              <code>foo</code>
            </link>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"[\`foo\`](link)"`);
    });
  });

  describe('code marks', () => {
    it('can contain other marks', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <code><i><b>foo</b></i></code>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"***\`foo\`***"`);
    });

    it('can be condensed when no other marks are present', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
          <code>foo</code>
          <code>bar</code>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"\`foo\`"`);
    });
  });

  describe('with nested styles within a single word', () => {
    it('should not produce invalid markdown when a bold word has italics applied to a smaller part', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <b>h</b>
            <b><i>e</i></b>
            <b>y</b>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"**h*e*y**"`);
    });

    it('should not produce invalid markdown when an italic word has bold applied to a smaller part', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <i>h</i>
            <i><b>e</b></i>
            <i>y</i>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"*h**e**y*"`);
    });

    it('should handle italics inside bold inside strikethrough', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <s>h</s>
            <s><b>e</b></s>
            <s><b><i>l</i></b></s>
            <s><b>l</b></s>
            <s>o</s>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"~~h**e*l*l**o~~"`);
    });

    it('should handle bold inside italics inside strikethrough', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <s>h</s>
            <s><i>e</i></s>
            <s><i><b>l</b></i></s>
            <s><i>l</i></s>
            <s>o</s>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"~~h*e**l**l*o~~"`);
    });

    it('should handle strikethrough inside italics inside bold', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <b>h</b>
            <b><i>e</i></b>
            <b><i><s>l</s></i></b>
            <b><i>l</i></b>
            <b>o</b>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"**h*e~~l~~l*o**"`);
    });

    it('should handle italics inside strikethrough inside bold', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <b>h</b>
            <b><s>e</s></b>
            <b><s><i>l</i></s></b>
            <b><s>l</s></b>
            <b>o</b>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"**h~~e*l*l~~o**"`);
    });

    it('should handle strikethrough inside bold inside italics', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <i>h</i>
            <i><b>e</b></i>
            <i><b><s>l</s></b></i>
            <i><b>l</b></i>
            <i>o</i>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"*h**e~~l~~l**o*"`);
    });

    it('should handle bold inside strikethrough inside italics', () => {
      // prettier-ignore
      const slateAst = (
        <document>
          <paragraph>
            <i>h</i>
            <i><s>e</s></i>
            <i><s><b>l</b></s></i>
            <i><s>l</s></i>
            <i>o</i>
          </paragraph>
        </document>
      );
      expect(slateToMarkdown(slateAst.toJSON())).toMatchInlineSnapshot(`"*h~~e**l**l~~o*"`);
    });
  });
});
