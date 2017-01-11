/* eslint react/prop-types: 0, react/no-multi-comp: 0 */
import React from 'react';
import { List, Map } from 'immutable';
import MarkupIt from 'markup-it';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import htmlSyntax from 'markup-it/syntaxes/html';
import reInline from 'markup-it/syntaxes/markdown/re/inline';
import { Icon } from '../UI';

/*
 * All Rich text widgets (Markdown, for example) should use Slate for text editing and
 * MarkupIt to convert between structured formats (Slate JSON, Markdown, HTML, etc.).
 * This module Processes and provides Slate nodes and MarkupIt syntaxes augmented with plugins
 */

let processedPlugins = List([]);

const nodes = {};
let augmentedMarkdownSyntax = markdownSyntax;
let augmentedHTMLSyntax = htmlSyntax;

function processEditorPlugins(plugins) {
  // Since the plugin list is immutable, a simple comparisson is enough
  // to determine whether we need to process again.
  if (plugins === processedPlugins) return;

  plugins.forEach((plugin) => {
    const basicRule = MarkupIt.Rule(plugin.id).regExp(plugin.pattern, (state, match) => (
    { data: plugin.fromBlock(match) }
    ));

    const markdownRule = basicRule.toText((state, token) => (
      `${ plugin.toBlock(token.getData().toObject()) }\n\n`
    ));

    const htmlRule = basicRule.toText((state, token) => (
      plugin.toPreview(token.getData().toObject())
    ));

    const nodeRenderer = (props) => {
      const { node, state } = props;
      const isFocused = state.selection.hasEdgeIn(node);
      const className = isFocused ? 'plugin active' : 'plugin';
      return (
        <div {...props.attributes} className={className}>
          <div className="plugin_icon" contentEditable={false}><Icon type={plugin.icon} /></div>
          <div className="plugin_fields" contentEditable={false}>
            {plugin.fields.map(field => `${ field.label }: “${ node.data.get(field.name) }”`)}
          </div>
        </div>
      );
    };

    augmentedMarkdownSyntax = augmentedMarkdownSyntax.addInlineRules(markdownRule);
    augmentedHTMLSyntax = augmentedHTMLSyntax.addInlineRules(htmlRule);
    nodes[plugin.id] = nodeRenderer;
  });

  processedPlugins = plugins;
}

function processAssetProxyPlugins(getAsset) {
  const assetProxyRule = MarkupIt.Rule('assetproxy').regExp(reInline.link, (state, match) => {
    if (match[0].charAt(0) !== '!') {
      // Return if this is not an image
      return;
    }

    const imgData = Map({
      alt: match[1],
      src: match[2],
      title: match[3],
    }).filter(Boolean);

    return {
      data: imgData,
    };
  });
  const assetProxyMarkdownRule = assetProxyRule.toText((state, token) => {
    const data = token.getData();
    const alt = data.get('alt', '');
    const src = data.get('src', '');
    const title = data.get('title', '');

    if (title) {
      return `![${ alt }](${ src } "${ title }")`;
    } else {
      return `![${ alt }](${ src })`;
    }
  });
  const assetProxyHTMLRule = assetProxyRule.toText((state, token) => {
    const data = token.getData();
    const alt = data.get('alt', '');
    const src = data.get('src', '');
    return `<img src=${ getAsset(src) } alt=${ alt } />`;
  });

  nodes.assetproxy = (props) => {
    /* eslint react/prop-types: 0 */
    const { node, state } = props;
    const isFocused = state.selection.hasEdgeIn(node);
    const className = isFocused ? 'active' : null;
    const src = node.data.get('src');
    return (
      <img {...props.attributes} src={getAsset(src)} className={className} />
    );
  };
  augmentedMarkdownSyntax = augmentedMarkdownSyntax.addInlineRules(assetProxyMarkdownRule);
  augmentedHTMLSyntax = augmentedHTMLSyntax.addInlineRules(assetProxyHTMLRule);
}

function getPlugins() {
  return processedPlugins.map(plugin => ({
    id: plugin.id,
    icon: plugin.icon,
    fields: plugin.fields,
  })).toArray();
}

function getNodes() {
  return nodes;
}

function getSyntaxes(getAsset) {
  if (getAsset) {
    processAssetProxyPlugins(getAsset);
  }
  return { markdown: augmentedMarkdownSyntax, html: augmentedHTMLSyntax };
}

export { processEditorPlugins, getNodes, getSyntaxes, getPlugins };
