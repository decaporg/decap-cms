import unified from 'unified';
import remarkParse from 'remark-parse';

import remarkAllowHtmlEntities from '../remarkAllowHtmlEntities';

function process(markdown) {
  const processor = unified().use(remarkParse).use(remarkAllowHtmlEntities);
  const mdast = processor.runSync(processor.parse(markdown));

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
}

describe('remarkAllowHtmlEntities', () => {
  it('should not decode HTML entities', () => {
    expect(process('&lt;div&gt;')).toEqual('&lt;div&gt;');
  });
});
