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

/**
 * Remove empty nodes, including the top level parents of deeply nested empty nodes.
 */
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

/**
 * If the first child of a list item is a list, include it in the previous list
 * item. Otherwise it translates to markdown as having two bullets. When
 * rehype-remark processes a list and finds children that are not list items, it
 * wraps them in list items, which leads to the condition this plugin addresses.
 * Dropbox Paper currently outputs this kind of HTML, which is invalid. We have
 * a support issue open for it, and this plugin can potentially be removed when
 * that's resolved.
 */
const remarkNestedList = () => {
  const transform = node => {
    if (node.type === 'list' && node.children && node.children.length > 1) {
      node.children = node.children.reduce((acc, childNode, index) => {
        if (index && childNode.children && childNode.children[0].type === 'list') {
          acc[acc.length - 1].children.push(transform(childNode.children.shift()))
          if (childNode.children.length) {
            acc.push(transform(childNode));
          }
        } else {
          acc.push(transform(childNode));
        }
        return acc;
      }, []);
      return node;
    }
    if (node.children) {
      node.children = node.children.map(transform);
    }
    return node;
  };
  return transform;
};

/**
 * Dropbox Paper outputs emoji characters as images, and stores the actual
 * emoji character in a `data-emoji-ch` attribute on the image. This plugin
 * replaces the images with the emoji characters.
 */
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
  const result = unified()
    .use(markdownToRemark, remarkParseConfig)
    .use(remarkToRehype)
    .use(rehypeRemoveEmpty)
    .use(rehypeSanitize)
    .use(rehypeMinifyWhitespace)
    .use(rehypeToHtml)
    .processSync(markdown)
    .contents;
  return result;
}

export const htmlToMarkdown = html => {
  const result = unified()
    .use(htmlToRehype, rehypeParseConfig)
    .use(rehypePaperEmoji)
    .use(rehypeSanitize)
    .use(rehypeRemoveEmpty)
    .use(rehypeMinifyWhitespace)
    .use(rehypeToRemark)
    .use(remarkNestedList)
    .use(remarkToMarkdown, remarkStringifyConfig)
    .processSync(html)
    .contents;
  return result;
};
