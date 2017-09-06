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
    expect(process('**[a](b)**')).toEqual('**[a](b)**');
  });
});
