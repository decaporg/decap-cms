import unified from 'unified';
import markdownToRemark from 'remark-parse';
import remarkAllowHtmlEntities from '../remarkAllowHtmlEntities';

const process = markdown => {
  const mdast = unified()
    .use(markdownToRemark)
    .use(remarkAllowHtmlEntities)
    .parse(markdown);

  /**
   * The MDAST will look like:
   *
   * { type: 'root', children: [
   *   { type: 'paragraph', children: [
   *     // results here
   *   ]}
   * ]}
   */
  return mdast.children[0].children[0].value;
};

describe('remarkAllowHtmlEntities', () => {
  it('should not decode HTML entities', () => {
    expect(process('&lt;div&gt;')).toEqual('&lt;div&gt;');
  });
});
