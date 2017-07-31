import { get, isEmpty, reduce } from 'lodash';
import unified from 'unified';
import u from 'unist-builder';
import markdownToRemarkPlugin from 'remark-parse';
import remarkToMarkdownPlugin from 'remark-stringify';
import remarkToRehype from 'remark-rehype';
import rehypeToHtml from 'rehype-stringify';
import htmlToRehype from 'rehype-parse';
import rehypeToRemark from 'rehype-remark';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import remarkToRehypeShortcodes from './remark-rehype-shortcodes';
import rehypeRemoveEmpty from './rehype-remove-empty';
import rehypePaperEmoji from './rehype-paper-emoji';
import remarkNestedList from './remark-nested-list';
import remarkToSlatePlugin from './remark-slate';
import remarkImagesToText from './remark-images-to-text';
import remarkShortcodes from './remark-shortcodes';
import registry from '../../../../lib/registry';

export const remarkToHtml = (mdast, getAsset) => {
  const result = unified()
    .use(remarkToRehypeShortcodes, { plugins: registry.getEditorComponents(), getAsset })
    .use(remarkToRehype, { allowDangerousHTML: true })
    .runSync(mdast);

  const output = unified()
    .use(rehypeToHtml, { allowDangerousHTML: true, allowDangerousCharacters: true })
    .stringify(result);
  return output
}

export const htmlToSlate = html => {
  const hast = unified()
    .use(htmlToRehype, { fragment: true })
    .parse(html);

  const result = unified()
    .use(rehypeRemoveEmpty)
    .use(rehypeMinifyWhitespace)
    .use(rehypePaperEmoji)
    .use(rehypeToRemark)
    .use(remarkNestedList)
    .use(remarkToSlatePlugin)
    .runSync(hast);

  return result;
};

export const markdownToRemark = markdown => {
  const parsed = unified()
    .use(markdownToRemarkPlugin, { fences: true, pedantic: true, footnotes: true, commonmark: true })
    .parse(markdown);

  const result = unified()
    .use(remarkImagesToText)
    .use(remarkShortcodes, { plugins: registry.getEditorComponents() })
    .runSync(parsed);

  return result;
};

export const remarkToMarkdown = obj => {
  /**
   * Rewrite the remark-stringify text visitor to simply return the text value,
   * without encoding or escaping any characters. This means we're completely
   * trusting the markdown that we receive.
   */
  function remarkAllowAllText() {
    const Compiler = this.Compiler;
    const visitors = Compiler.prototype.visitors;
    visitors.text = node => node.value;
  };

  const mdast = obj || u('root', [u('paragraph', [u('text', '')])]);
  const result = unified()
    .use(remarkToMarkdownPlugin, { listItemIndent: '1', fences: true, pedantic: true, commonmark: true })
    .use(remarkAllowAllText)
    .stringify(mdast);
  return result;
};

export const remarkToSlate = mdast => {
  const result = unified()
    .use(remarkToSlatePlugin)
    .runSync(mdast);
  return result;
};

export const slateToRemark = (raw, shortcodePlugins) => {
  const typeMap = {
    'paragraph': 'paragraph',
    'heading-one': 'heading',
    'heading-two': 'heading',
    'heading-three': 'heading',
    'heading-four': 'heading',
    'heading-five': 'heading',
    'heading-six': 'heading',
    'quote': 'blockquote',
    'code': 'code',
    'numbered-list': 'list',
    'bulleted-list': 'list',
    'list-item': 'listItem',
    'table': 'table',
    'table-row': 'tableRow',
    'table-cell': 'tableCell',
    'thematic-break': 'thematicBreak',
    'link': 'link',
    'image': 'image',
  };
  const markMap = {
    bold: 'strong',
    italic: 'emphasis',
    strikethrough: 'delete',
    code: 'inlineCode',
  };
  const transform = node => {
    const children = isEmpty(node.nodes) ? node.nodes : node.nodes.reduce((acc, childNode) => {
      if (childNode.kind !== 'text') {
        acc.push(transform(childNode));
        return acc;
      }
      if (childNode.ranges) {
        childNode.ranges.forEach(range => {
          const { marks = [], text } = range;
          const markTypes = marks.map(mark => markMap[mark.type]);
          if (markTypes.includes('inlineCode')) {
            acc.push(u('inlineCode', text));
          } else {
            const textNode = u('html', text);
            const nestedText = !markTypes.length ? textNode : markTypes.reduce((acc, markType) => {
              const nested = u(markType, [acc]);
              return nested;
            }, textNode);
            acc.push(nestedText);
          }
        });
      } else {

        acc.push(u('html', childNode.text));
      }
      return acc;
    }, []);

    if (node.type === 'root') {
      return u('root', children);
    }

    if (node.type === 'shortcode') {
      const { data } = node;
      const plugin = shortcodePlugins.get(data.shortcode);
      const text = plugin.toBlock(data.shortcodeData);
      const textNode = u('html', text);
      return u('paragraph', { data }, [ textNode ]);
    }

    if (node.type.startsWith('heading')) {
      const depths = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
      const depth = node.type.split('-')[1];
      const props = { depth: depths[depth] };
      return u(typeMap[node.type], props, children);
    }

    if (['paragraph', 'quote', 'list-item', 'table', 'table-row', 'table-cell'].includes(node.type)) {
      return u(typeMap[node.type], children);
    }

    if (node.type === 'code') {
      const value = get(node.nodes, [0, 'text']);
      const props = { lang: get(node.data, 'lang') };
      return u(typeMap[node.type], props, value);
    }

    if (['numbered-list', 'bulleted-list'].includes(node.type)) {
      const ordered = node.type === 'numbered-list';
      const props = { ordered, start: get(node.data, 'start') || 1 };
      return u(typeMap[node.type], props, children);
    }

    if (node.type === 'thematic-break') {
      return u(typeMap[node.type]);
    }

    if (node.type === 'link') {
      const data = get(node, 'data', {});
      const { url, title } = data;
      return u(typeMap[node.type], data, children);
    }

    if (node.type === 'image') {
      const data = get(node, 'data', {});
      const { url, title, alt } = data;
      return u(typeMap[node.type], data);
    }
  }
  raw.type = 'root';
  const mdast = transform(raw);

  const result = unified()
    .use(remarkShortcodes, { plugins: registry.getEditorComponents() })
    .runSync(mdast);

  return result;
};
