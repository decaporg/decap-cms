import find from 'lodash/find';
import unified from 'unified';
import markdownToRemark from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import rehypeToHtml from 'rehype-stringify';
import htmlToRehype from 'rehype-parse';
import rehypeToRemark from 'rehype-remark';
import remarkToMarkdown from 'remark-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';

const remarkParseConfig = { fences: true };
const remarkStringifyConfig = { listItemIndent: '1', fences: true };
const rehypeParseConfig = { fragment: true };

const rehypeRemoveEmpty = () => {
  const isVoidElement = node => ['img', 'hr'].includes(node.tagName);
  const isNonEmptyText = node => node.type === 'text' && node.value;
  const isNonEmptyNode =  node => {
    return isVoidElement(node) || isNonEmptyText(node) || find(node.children, isNonEmptyNode);
  };

  const transform = node => {
    if (isVoidElement(node) || isNonEmptyText(node)) {
      return node;
    }
    if (node.children) {
      node.children = node.children.reduce((acc, childNode) => {
        if (isVoidElement(childNode) || isNonEmptyText(childNode)) {
          return acc.concat(childNode);
        }
        return find(childNode.children, isNonEmptyNode) ? acc.concat(transform(childNode)) : acc;
      }, []);
    }
    return node;
  };
  return transform;
};

const rehypePaperEmoji = () => {
  const transform = node => {
    if (node.tagName === 'img' && node.properties.dataEmojiCh) {
      return { type: 'text', value: node.properties.dataEmojiCh };
    }
    node.children = node.children ? node.children.map(transform) : node.children;
    return node;
  };
  return transform;
};

export const markdownToHtml = markdown => {
  console.log('markdownToHtml input', markdown);
  const result = unified()
    .use(markdownToRemark, remarkParseConfig)
    .use(remarkToRehype)
    .use(rehypeToHtml)
    .processSync(markdown)
    .contents;
  console.log('markdownToHtml output', result);
  return result;
}

export const htmlToMarkdown = html => {
  console.log('htmlToMarkdown input', html);
  const result = unified()
    .use(htmlToRehype, rehypeParseConfig)
    .use(rehypeToRemark)
    .use(remarkToMarkdown, remarkStringifyConfig)
    .processSync(html)
    .contents;
  console.log('htmlToMarkdown output', result);
  return result;
};
