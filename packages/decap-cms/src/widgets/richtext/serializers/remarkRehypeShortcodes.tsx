import React from 'react';
import { renderToString } from 'react-dom/server';
import u from 'unist-builder';

import type {
  EditorComponent,
  EditorComponentsRegistry,
  GetAssetFunction,
  MdastNode,
  MdastRoot,
  ResolveWidgetFunction,
  ShortcodeData,
} from '@/widgets/richtext/types';
import type { ReactElement } from 'react';

interface RemarkToRehypeShortcodesOptions {
  plugins: EditorComponentsRegistry;
  getAsset?: GetAssetFunction | undefined;
  resolveWidget?: ResolveWidgetFunction | undefined;
  /** Renders nested markdown/richtext sub-field values back to HTML. */
  toHtml?: ((markdown: string) => string) | undefined;
}

/**
 * This plugin doesn't actually transform Remark (MDAST) nodes to Rehype
 * (HAST) nodes, but rather, it prepares an MDAST shortcode node for HAST
 * conversion by replacing the shortcode text with stringified HTML for
 * previewing the shortcode output.
 */
export default function remarkToRehypeShortcodes({
  plugins,
  getAsset,
  resolveWidget,
  toHtml,
}: RemarkToRehypeShortcodesOptions) {
  /**
   * Retrieve the shortcode preview markup or component.
   */
  function getPreview(
    plugin: EditorComponent,
    shortcodeData: ShortcodeData,
  ): string | ReactElement | null {
    const { toPreview, fields } = plugin;
    if (toPreview) {
      return toPreview(shortcodeData, getAsset, fields);
    }

    /**
     * For editor components without a custom `toPreview` (e.g. container
     * components with nested markdown/richtext fields), render each sub-field
     * value using the appropriate widget preview.
     */
    if (fields && fields.length > 0 && toHtml) {
      return fields
        .map(field => {
          const widget = field.widget ?? 'string';
          const fieldValue = shortcodeData[field.name];

          if (!fieldValue) return '';

          if (typeof fieldValue === 'string' && (widget === 'markdown' || widget === 'richtext')) {
            return toHtml(fieldValue);
          }

          return `<p>${String(fieldValue)}</p>`;
        })
        .join('');
    }

    /**
     * Last resort fallback: try resolving the widget and rendering its preview.
     */
    const widget = resolveWidget?.(plugin.widget);
    if (!widget?.preview) return null;

    return React.createElement(widget.preview, {
      value: shortcodeData,
      field: plugin,
      getAsset,
    });
  }

  /**
   * Turn a shortcode node into one holding its preview markup.
   */
  function renderShortcode(node: MdastNode, shortcode: string): MdastNode {
    /**
     * Retrieve the matching plugin by key.
     */
    const plugin = plugins.get(shortcode);
    if (!plugin) return node;

    const shortcodeData = node.data?.shortcodeData ?? {};

    /**
     * Run the shortcode plugin's `toPreview` method, which will return either
     * an HTML string or a React component. If a React component is returned,
     * render it to an HTML string.
     */
    const value = getPreview(plugin, shortcodeData);
    const valueHtml = value === null || typeof value === 'string' ? value ?? '' : renderToString(value);

    /**
     * Return a new 'html' type node containing the shortcode preview markup.
     */
    const textNode = u<MdastNode>('html', valueHtml);
    return { ...node, children: [textNode] };
  }

  /**
   * Recursively transform nodes that contain shortcodes. Shortcodes can sit
   * below the root, e.g. a block image inside a list item (decaporg #7898);
   * left untransformed, remark-rehype drops them from the preview.
   */
  function processShortcodes(node: MdastNode): MdastNode {
    const shortcode = node.data?.shortcode;
    const transformedNode = typeof shortcode === 'string' ? renderShortcode(node, shortcode) : node;

    if (!transformedNode.children) {
      return transformedNode;
    }

    return { ...transformedNode, children: transformedNode.children.map(processShortcodes) };
  }

  return function transform(root: MdastRoot): MdastRoot {
    return { ...root, children: root.children.map(processShortcodes) };
  };
}
