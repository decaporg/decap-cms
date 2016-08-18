import React from 'react';
import { List } from 'immutable';
import MarkupIt from 'markup-it';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import htmlSyntax from 'markup-it/syntaxes/html';
import { Icon } from '../UI';

/*
 * All Rich text widgets (Markdown, for example) should use Slate for text editing and
 * MarkupIt to convert between structured formats (Slate JSON, Markdown, HTML, etc.).
 * This module Processes and provides Slate nodes and MarkupIt syntaxes augmented with plugins
 */

let processedPlugins = List([]);


const nodes = {};
const augmentedMarkdownSyntax = markdownSyntax;
const augmentedHTMLSyntax = htmlSyntax;

function processEditorPlugins(plugins) {
  // Since the plugin list is immutable, a simple comparisson is enough
  // to determine whether we need to process again.
  if (plugins === processedPlugins) return;

  plugins.forEach(plugin => {
    const markdownRule = MarkupIt.Rule(plugin.id)
      .regExp(plugin.pattern, function(state, match) { return plugin.fromBlock(match); })
      .toText(function(state, token) { return plugin.toBlock(token.getData()); });

    const htmlRule = MarkupIt.Rule(plugin.id)
      .regExp(plugin.pattern, function(state, match) { return plugin.fromBlock(match); })
      .toText(function(state, token) { return plugin.toPreview(token.getData()); });

    const nodeRenderer = (props) => {
      /* eslint react/prop-types: 0 */
      const { node, state } = props;
      const isFocused = state.selection.hasEdgeIn(node);
      const className = isFocused ? 'plugin active' : 'plugin';
      return (
        <div {...props.attributes} className={className}>
          <Icon type={plugin.icon}/>
        </div>
      );
    };

    augmentedMarkdownSyntax.addInlineRules(markdownRule);
    augmentedHTMLSyntax.addInlineRules(htmlRule);
    nodes[plugin.id] = nodeRenderer;
  });

  processedPlugins = plugins;
}

function getPlugins() {
  return processedPlugins.map(plugin => (
    { id: plugin.id, icon: plugin.icon }
  )).toArray();
}

function getNodes() {
  return nodes;
}

function getSyntaxes() {
  return { markdown: augmentedMarkdownSyntax, html:augmentedHTMLSyntax };
}

export { processEditorPlugins, getNodes, getSyntaxes, getPlugins };
