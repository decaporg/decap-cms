import { flow } from 'lodash';
import { markdownToSlate, slateToMarkdown } from '../index';

const process = flow([markdownToSlate, slateToMarkdown]);

describe('slate', () => {
  it('should distinguish between newlines and hard breaks', () => {
    expect(process('a\n')).toEqual('a\n');
  });

  it('should not decode encoded html entities in inline code', () => {
    expect(process('<code>&lt;div&gt;</code>')).toEqual('<code>&lt;div&gt;</code>\n');
  });

  it('should parse non-text children of mark nodes', () => {
    expect(process('**a[b](c)d**')).toEqual('**a[b](c)d**\n');
    expect(process('**[a](b)**')).toEqual('**[a](b)**\n');
    expect(process('**![a](b)**')).toEqual('**![a](b)**\n');
    expect(process('_`a`_')).toEqual('_`a`_\n');
  });

  it('should condense adjacent, identically styled text and inline nodes', () => {
    expect(process('**a ~~b~~~~c~~**')).toEqual('**a ~~bc~~**\n');
    expect(process('**a ~~b~~~~[c](d)~~**')).toEqual('**a ~~b[c](d)~~**\n');
  });

  it('should handle nested markdown entities', () => {
    expect(process('**a**b**c**')).toEqual('**a**b**c**\n');
    expect(process('**a _b_ c**')).toEqual('**a _b_ c**\n');
  });
});
