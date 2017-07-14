import find from 'lodash/find';
import unified from 'unified';
import markdownToRemark from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import rehypeToHtml from 'rehype-stringify';
import htmlToRehype from 'rehype-parse';
import rehypeToRemark from 'rehype-remark';
import remarkToMarkdown from 'remark-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeReparse from 'rehype-raw';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import ReactDOMServer from 'react-dom/server';
import registry from '../../../lib/registry';
import merge from 'deepmerge';
import rehypeSanitizeSchemaDefault from 'hast-util-sanitize/lib/github';
import hastFromString from 'hast-util-from-string';
import hastToMdastHandlerAll from 'hast-util-to-mdast/all';
import { reduce, capitalize } from 'lodash';

const shortcodeAttributePrefix = 'ncp';

/**
 * Remove empty nodes, including the top level parents of deeply nested empty nodes.
 */
const rehypeRemoveEmpty = () => {
  const isVoidElement = node => ['img', 'hr'].includes(node.tagName);
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

const rehypeShortcodes = () => {
  const plugins = registry.getEditorComponents();
  const transform = node => {
    const { properties } = node;

    // Convert this logic into a parseShortcodeDataFromHtml shared function, as
    // this is also used in the visual editor serializer
    const dataPrefix = `data${capitalize(shortcodeAttributePrefix)}`;
    const pluginId = properties && properties[dataPrefix];
    const plugin = plugins.get(pluginId);

    if (plugin) {
      const data = reduce(properties, (acc, value, key) => {
        if (key.startsWith(dataPrefix)) {
          const dataKey = key.slice(dataPrefix.length).toLowerCase();
          if (dataKey) {
            acc[dataKey] = value;
          }
        }
        return acc;
      }, {});

      node.data = node.data || {};
      node.data[shortcodeAttributePrefix] = true;

      return hastFromString(node, plugin.toBlock(data));
    }

    node.children = node.children ? node.children.map(transform) : node.children;

    return node;
  };
  return transform;
}

/**
 * we can't escape the less than symbol
 * which means how do we know {{<thing attr>}} from <tag attr> ?
 * maybe we escape nothing
 * then we can check for shortcodes in a unified plugin
 * and only check against text nodes
 * and maybe narrow the target text nodes even further somehow
 * and make shortcode parsing faster
 */
function remarkPrecompileShortcodes() {
  const Compiler = this.Compiler;
  const visitors = Compiler.prototype.visitors;
  const textVisitor = visitors.text;

  visitors.text = newTextVisitor;

  function newTextVisitor(node, parent) {
    if (parent.data && parent.data[shortcodeAttributePrefix]) {
      return node.value;
    }
    return textVisitor.call(this, node, parent);
  }
}

const parseShortcodesFromMarkdown = markdown => {
  const plugins = registry.getEditorComponents();
  const markdownLines = markdown.split('\n');
  const markdownLinesParsed = plugins.reduce((lines, plugin) => {
    const result = lines.map(line => {
      return line.replace(plugin.pattern, (...match) => {
        const data = plugin.fromBlock(match);
        const preview = plugin.toPreview(data);
        const html = typeof preview === 'string' ? preview : ReactDOMServer.renderToStaticMarkup(preview);
        const dataAttrs = reduce(data, (attrs, val, key) => {
          attrs.push(`data-${shortcodeAttributePrefix}-${key}="${val}"`);
          return attrs;
        }, [`data-${shortcodeAttributePrefix}="${plugin.id}"`]);
        const result = `<div ${dataAttrs.join(' ')}>${html}</div>`;
        return result;
      });
    });
    return result;
  }, markdownLines);
  return markdownLinesParsed.join('\n');
};

const rehypeSanitizeSchema = merge(rehypeSanitizeSchemaDefault, { attributes: { '*': [ 'data*' ] } });

export const markdownToHtml = markdown => {
  // Parse shortcodes from the raw markdown rather than via Unified plugin.
  // This ensures against conflicts between shortcode syntax and Unified
  // parsing rules.
  const markdownWithParsedShortcodes = parseShortcodesFromMarkdown(markdown);
  const result = unified()
    .use(markdownToRemark, { fences: true })
    .use(remarkToRehype, { allowDangerousHTML: true })
    .use(rehypeReparse)
    .use(rehypeRemoveEmpty)
    .use(rehypeSanitize, rehypeSanitizeSchema)
    .use(rehypeMinifyWhitespace)
    .use(rehypeToHtml, { allowDangerousHTML: true })
    .processSync(markdownWithParsedShortcodes)
    .contents;
  return result;
}

export const htmlToMarkdown = html => {
  const result = unified()
    .use(htmlToRehype, { fragment: true })
    .use(rehypeSanitize, rehypeSanitizeSchema)
    .use(rehypeRemoveEmpty)
    .use(rehypeMinifyWhitespace)
    .use(rehypePaperEmoji)
    .use(rehypeShortcodes)
    .use(rehypeToRemark, { handlers: { div: (h, node) => {
      const dataPrefix = `data${capitalize(shortcodeAttributePrefix)}`;
      const isShortcode = node.properties[dataPrefix];
      if (isShortcode) {
        const paragraph = h(node, 'paragraph', hastToMdastHandlerAll(h, node));
        paragraph.data = paragraph.data || {};
        paragraph.data[shortcodeAttributePrefix] = true;
        return paragraph;
      }
    }}})
    .use(() => node => {
      return node;
    })
    .use(remarkNestedList)
    .use(remarkToMarkdown, { listItemIndent: '1', fences: true })
    .use(remarkPrecompileShortcodes)
    /*
    .use(() => node => {
      return node;
    })
    */
    .processSync(html)
    .contents;
  return result;
};
