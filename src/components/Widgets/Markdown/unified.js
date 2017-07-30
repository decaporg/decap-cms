import { get, has, find, isEmpty, every, map } from 'lodash';
import { renderToString } from 'react-dom/server';
import unified from 'unified';
import u from 'unist-builder';
import markdownToRemarkPlugin from 'remark-parse';
import remarkToMarkdownPlugin from 'remark-stringify';
import mdastDefinitions from 'mdast-util-definitions';
import mdastToString from 'mdast-util-to-string';
import modifyChildren from 'unist-util-modify-children';
import remarkToRehype from 'remark-rehype';
import rehypeToHtml from 'rehype-stringify';
import htmlToRehype from 'rehype-parse';
import rehypeToRemark from 'rehype-remark';
import rehypeReparse from 'rehype-raw';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import ReactDOMServer from 'react-dom/server';
import registry from '../../../lib/registry';
import merge from 'deepmerge';
import hastFromString from 'hast-util-from-string';
import hastToMdastHandlerAll from 'hast-util-to-mdast/all';
import { reduce, capitalize } from 'lodash';

/**
 * Remove empty nodes, including the top level parents of deeply nested empty nodes.
 */
const rehypeRemoveEmpty = () => {
  const isVoidElement = node => ['img', 'hr', 'br'].includes(node.tagName);
  const isNonEmptyLeaf = node => ['text', 'raw'].includes(node.type) && node.value;
  const isShortcode = node => node.properties && node.properties[`data${capitalize(shortcodeAttributePrefix)}`];
  const isNonEmptyNode =  node => {
    return isVoidElement(node)
      || isNonEmptyLeaf(node)
      || isShortcode(node)
      || find(node.children, isNonEmptyNode);
  };

  const transform = node => {
    if (isVoidElement(node) || isNonEmptyLeaf(node) || isShortcode(node)) {
      return node;
    }
    if (node.children) {
      node.children = node.children.reduce((acc, childNode) => {
        if (isVoidElement(childNode) || isNonEmptyLeaf(childNode) || isShortcode(node)) {
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

/**
 * Rewrite the remark-stringify text visitor to simply return the text value,
 * without encoding or escaping any characters. This means we're completely
 * trusting the markdown that we receive.
 */
function remarkPrecompileShortcodes() {
  const Compiler = this.Compiler;
  const visitors = Compiler.prototype.visitors;
  visitors.text = node => node.value;
};


/**
 * Parse shortcodes from an MDAST.
 *
 * Shortcodes are plain text, and must be the lone content of a paragraph. The
 * paragraph must also be a direct child of the root node. When a shortcode is
 * found, we just need to add data to the node so the shortcode can be
 * identified and processed when serializing to a new format. The paragraph
 * containing the node is also recreated to ensure normalization.
 */
const remarkShortcodes = ({ plugins }) => {
  return transform;

  /**
   * Map over children of the root node and convert any found shortcode nodes.
   */
  function transform(root) {
    const transformedChildren = map(root.children, processShortcodes);
    return { ...root, children: transformedChildren };
  }

  /**
   * Mapping function to transform nodes that contain shortcodes.
   */
  function processShortcodes(node) {
    /**
     * If the node is not eligible to contain a shortcode, return the original
     * node unchanged.
     */
    if (!nodeMayContainShortcode(node)) return node;

    /**
     * Combine the text values of all children to a single string, then
     * check that string for a shortcode pattern match.
     */
    const text = mdastToString(node);
    const { plugin, match } = matchTextToPlugin(text);

    /**
     * If a matching shortcode plugin is found, return a new node with shortcode
     * data included. Otherwise, return the original node.
     */
    return plugin ? createShortcodeNode(text, plugin, match) : node;
  };

  /**
   * Ensure that the node and it's children are acceptable types to contain
   * shortcodes. Currently, only a paragraph containing text and/or html nodes
   * may contain shortcodes.
   */
  function nodeMayContainShortcode(node) {
    const validNodeTypes = ['paragraph'];
    const validChildTypes = ['text', 'html'];

    if (validNodeTypes.includes(node.type)) {
      return every(node.children, child => {
        return validChildTypes.includes(child.type);
      });
    }
  }

  /**
   * Return the plugin and RegExp.match result from the first plugin with a
   * pattern that matches the given text.
   */
  function matchTextToPlugin(text) {
    let match;
    const plugin = plugins.find(p => {
      match = text.match(p.pattern);
      return !!match;
    });
    return { plugin, match };
  }

  /**
   * Create a new node with shortcode data included. Use an 'html' node instead
   * of a 'text' node as the child to ensure the node content is not parsed by
   * Remark or Rehype. Include the child as an array because an MDAST paragraph
   * node must have it's children in an array.
   */
  function createShortcodeNode(text, plugin, match) {
    const shortcode = plugin.id;
    const shortcodeData = plugin.fromBlock(match);
    const data = { shortcode, shortcodeData };
    const textNode = u('html', text);
    return u('paragraph', { data }, [textNode]);
  }
};


/**
 * This plugin doesn't actually transform Remark (MDAST) nodes to Rehype
 * (HAST) nodes, but rather, it prepares an MDAST shortcode node for HAST
 * conversion by replacing the shortcode text with stringified HTML for
 * previewing the shortcode output.
 */
const remarkToRehypeShortcodes = ({ plugins, getAsset }) => {
  return transform;

  function transform(root) {
    const transformedChildren = map(root.children, processShortcodes);
    return { ...root, children: transformedChildren };
  }

  /**
   * Mapping function to transform nodes that contain shortcodes.
   */
  function processShortcodes(node) {
    /**
     * If the node doesn't contain shortcode data, return the original node.
     */
    if (!has(node, ['data', 'shortcode'])) return node;

    /**
     * Get shortcode data from the node, and retrieve the matching plugin by
     * key.
     */
    const { shortcode, shortcodeData } = node.data;
    const plugin = plugins.get(shortcode);

    /**
     * Run the shortcode plugin's `toPreview` method, which will return either
     * an HTML string or a React component. If a React component is returned,
     * render it to an HTML string.
     */
    const value = plugin.toPreview(shortcodeData, getAsset);
    const valueHtml = typeof value === 'string' ? value : renderToString(value);

    /**
     * Return a new 'html' type node containing the shortcode preview markup.
     */
    return u('html', valueHtml);
  }
};

const remarkToSlatePlugin = () => {
  const typeMap = {
    paragraph: 'paragraph',
    blockquote: 'quote',
    code: 'code',
    listItem: 'list-item',
    table: 'table',
    tableRow: 'table-row',
    tableCell: 'table-cell',
    thematicBreak: 'thematic-break',
    link: 'link',
    image: 'image',
  };
  const markMap = {
    strong: 'bold',
    emphasis: 'italic',
    delete: 'strikethrough',
    inlineCode: 'code',
  };
  const toTextNode = (text, data) => ({ kind: 'text', text, data });
  const wrapText = (node, index, parent) => {
    if (['text', 'html'].includes(node.type)) {
      parent.children.splice(index, 1, u('paragraph', [node]));
    }
  };

  let getDefinition;
  const transform = (node, index, siblings, parent) => {
    let nodes;

    if (node.type === 'root') {
      // Create definition getter for link and image references
      getDefinition = mdastDefinitions(node);
      // Ensure top level text nodes are wrapped in paragraphs
      modifyChildren(wrapText)(node);
    }

    if (isEmpty(node.children)) {
      nodes = node.children;
    } else {
      // If a node returns a falsey value, exclude it. Some nodes do not
      // translate from MDAST to Slate, such as definitions for link/image
      // references or footnotes.
      //
      // Consider using unist-util-remove instead for this.
      nodes = node.children.reduce((acc, childNode, idx, sibs) => {
        const transformed = transform(childNode, idx, sibs, node);
        if (transformed) {
          acc.push(transformed);
        }
        return acc;
      }, []);
    }

    if (node.type === 'root') {
      return { nodes };
    }

    /**
     * Convert MDAST shortcode nodes to Slate 'shortcode' type nodes.
     */
    if (get(node, ['data', 'shortcode'])) {
      const { data } = node;
      const nodes = [ toTextNode('') ];
      return { kind: 'block', type: 'shortcode', data, isVoid: true, nodes };
    }

    // Process raw html as text, since it's valid markdown
    if (['text', 'html'].includes(node.type)) {
      return toTextNode(node.value, node.data);
    }

    if (node.type === 'inlineCode') {
      return { kind: 'text', ranges: [{ text: node.value, marks: [{ type: 'code' }] }] };
    }

    if (['strong', 'emphasis', 'delete'].includes(node.type)) {
      const remarkToSlateMarks = (markNode, parentMarks = []) => {
        const marks = [...parentMarks, { type: markMap[markNode.type] }];
        const ranges = [];
        markNode.children.forEach(childNode => {
          if (['html', 'text'].includes(childNode.type)) {
            ranges.push({ text: childNode.value, marks });
            return;
          }
          const nestedRanges = remarkToSlateMarks(childNode, marks);
          ranges.push(...nestedRanges);
        });
        return ranges;
      };

      return { kind: 'text', ranges: remarkToSlateMarks(node) };
    }

    if (node.type === 'heading') {
      const depths = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };
      return { kind: 'block', type: `heading-${depths[node.depth]}`, nodes };
    }

    if (['paragraph', 'blockquote', 'tableRow', 'tableCell'].includes(node.type)) {
      return { kind: 'block', type: typeMap[node.type], nodes };
    }

    if (node.type === 'code') {
      const data = { lang: node.lang };
      const text = toTextNode(node.value);
      const nodes = [text];
      return { kind: 'block', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'list') {
      const slateType = node.ordered ? 'numbered-list' : 'bulleted-list';
      const data = { start: node.start };
      return { kind: 'block', type: slateType, data, nodes };
    }

    if (node.type === 'listItem') {
      const data = { checked: node.checked };
      return { kind: 'block', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'table') {
      const data = { align: node.align };
      return { kind: 'block', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'thematicBreak') {
      return { kind: 'block', type: typeMap[node.type], isVoid: true };
    }

    if (node.type === 'link') {
      const { title, url } = node;
      const data = { title, url };
      return { kind: 'inline', type: typeMap[node.type], data, nodes };
    }

    if (node.type === 'linkReference') {
      const definition = getDefinition(node.identifier);
      const data = {};
      if (definition) {
        data.title = definition.title;
        data.url = definition.url;
      }
      return { kind: 'inline', type: typeMap['link'], data, nodes };
    }

    if (node.type === 'image') {
      const { title, url, alt } = node;
      const data = { title, url, alt };
      return { kind: 'block', type: typeMap[node.type], data };
    }

    if (node.type === 'imageReference') {
      const definition = getDefinition(node.identifier);
      const data = {};
      if (definition) {
        data.title = definition.title;
        data.url = definition.url;
      }
      return { kind: 'block', type: typeMap['image'], data };
    }
  };

  // Since `transform` is used for recursive child mapping, ensure that only the
  // first argument is supplied on the initial call.
  return node => transform(node);
};

const slateToRemarkPlugin = () => {
  const transform = node => {
    console.log(node);
    return node;
  };
  return transform;
};

/**
 * Images must be parsed as shortcodes for asset proxying. This plugin converts
 * MDAST image nodes back to text to allow shortcode pattern matching.
 */
const remarkImagesToText = () => {
  return transform;

  function transform(node) {
    const children = node.children ? node.children.map(transform) : node.children;
    if (node.type === 'image') {
      const alt = node.alt || '';
      const url = node.url || '';
      const title = node.title ? ` "${node.title}"` : '';
      return { type: 'text', value: `![${alt}](${url}${title})` };
    }
    return { ...node, children };
  }
}

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
  const mdast = obj || u('root', [u('paragraph', [u('text', '')])]);

  const result = unified()
    .use(remarkToMarkdownPlugin, { listItemIndent: '1', fences: true, pedantic: true, commonmark: true })
    .use(remarkPrecompileShortcodes)
    .stringify(mdast);
  return result;
};

export const remarkToSlate = mdast => {
  const result = unified()
    .use(remarkToSlatePlugin)
    .runSync(mdast);
  return result;
};

export const slateToRemark = raw => {
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
      const textNode = u('html', data.shortcodeValue);
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

export const remarkToHtml = (mdast, getAsset) => {
  const result = unified()
    .use(remarkToRehypeShortcodes, { plugins: registry.getEditorComponents(), getAsset })
    .use(remarkToRehype, { allowDangerousHTML: true })
    .runSync(mdast);

  const output = unified()
    .use(rehypeToHtml, { allowDangerousHTML: true, allowDangerousCharacters: true, entities: { subset: [] } })
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
