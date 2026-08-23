import React from 'react';
import has from 'lodash/has';
import { renderToString } from 'react-dom/server';
import u from 'unist-builder';

/**
 * This plugin doesn't actually transform Remark (MDAST) nodes to Rehype
 * (HAST) nodes, but rather, it prepares an MDAST shortcode node for HAST
 * conversion by replacing the shortcode text with stringified HTML for
 * previewing the shortcode output.
 */
export default function remarkToRehypeShortcodes({ plugins, getAsset, resolveWidget, toHtml }) {
  return transform;

  function transform(root) {
    function walk(node) {
      if (!node) return node;
      if (has(node, ['data', 'shortcode'])) {
        return processShortcodes(node);
      }
      if (Array.isArray(node.children)) {
        return {
          ...node,
          children: node.children.map(walk),
        };
      }
      return node;
    }

    return walk(root);
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
    if (!plugin) return node;

    /**
     * Run the shortcode plugin's `toPreview` method, which will return either
     * an HTML string or a React component. If a React component is returned,
     * render it to an HTML string.
     */
    const value = getPreview(plugin, shortcodeData);
    const valueHtml = typeof value === 'string' ? value : renderToString(value);

    /**
     * Return a new 'html' type node containing the shortcode preview markup.
     */
    return u('html', valueHtml);
  }

  /**
   * Retrieve the shortcode preview component.
   */
  function getPreview(plugin, shortcodeData) {
    const { toPreview, fields } = plugin;
    if (toPreview) {
      return toPreview(shortcodeData, getAsset, fields);
    }

    /**
     * For editor components without a custom `toPreview` (e.g. container
     * components with nested markdown/richtext fields), render each sub-field
     * value using the appropriate widget preview.
     */
    if (fields && fields.size > 0 && toHtml) {
      const htmlParts = fields
        .map(field => {
          const name = field.get('name');
          const widget = field.get('widget') || 'string';
          const fieldValue = shortcodeData ? shortcodeData[name] : '';

          if (!fieldValue) return '';

          if (widget === 'markdown' || widget === 'richtext') {
            return toHtml(fieldValue);
          }

          return `<p>${fieldValue}</p>`;
        })
        .toArray();

      return htmlParts.join('');
    }

    /**
     * Last resort fallback: try resolving the widget and rendering its preview.
     */
    const preview = resolveWidget(plugin.widget);
    return React.createElement(preview.preview, {
      value: shortcodeData,
      field: plugin,
      getAsset,
    });
  }
}
