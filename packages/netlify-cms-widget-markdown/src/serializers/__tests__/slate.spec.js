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
});
