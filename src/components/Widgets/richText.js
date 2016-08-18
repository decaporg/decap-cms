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

  plugins.forEach(plugin => {
    const markdownRule = MarkupIt.Rule(plugin.id)
      .regExp(plugin.pattern, function(state, match) {
        return { data: plugin.fromBlock(match) };
      })
      .toText(function(state, token) { return plugin.toBlock(token.getData().toObject()) + '\n\n'; });

    const htmlRule = MarkupIt.Rule(plugin.id)
      .regExp(plugin.pattern, function(state, match) { return plugin.fromBlock(match); })
      .toText(function(state, token) { return plugin.toPreview(token.getData()); });

    const nodeRenderer = (props) => {
      const { node, state } = props;
      const isFocused = state.selection.hasEdgeIn(node);
      const className = isFocused ? 'plugin active' : 'plugin';
      return (
        <div {...props.attributes} className={className}>
          <div className="plugin_icon" contentEditable={false}><Icon type={plugin.icon}/></div>
          <div className="plugin_fields" contentEditable={false}>
            { plugin.fields.map(field => `${field.label}: “${node.data.get(field.name)}”`) }
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

function processMediaProxyPlugins(getMedia) {
  const customImageRule = MarkupIt.Rule('mediaproxy')
    .regExp(reInline.link, function(state, match) {
      if (match[0].charAt(0) !== '!') {
        // Return if this is not an image
        return;
      }

      var imgData = Map({
        alt:   match[1],
        src:   getMedia(match[2]),
        title: match[3]
      }).filter(Boolean);

      return {
        data: imgData
      };
    })
    .toText(function(state, token) {
      var data  = token.getData();
      var alt   = data.get('alt', '');
      var src   = getMedia(data.get('src', ''));
      var title = data.get('title', '');

      if (title) {
        return '![' + alt + '](' + src + ' "' + title + '")';
      } else {
        return '![' + alt + '](' + src + ')';
      }
    });

  nodes['mediaproxy'] = (props) => {
    /* eslint react/prop-types: 0 */
    const { node, state } = props;
    const isFocused = state.selection.hasEdgeIn(node);
    const className = isFocused ? 'active' : null;
    const src = node.data.get('src');
    return (
      <img {...props.attributes} src={getMedia(src)} className={className} />
    );
  };
  augmentedMarkdownSyntax = augmentedMarkdownSyntax.addInlineRules(customImageRule);
}

function getPlugins() {
  return processedPlugins.map(plugin => (
    { id: plugin.id, icon: plugin.icon, fields: plugin.fields }
  )).toArray();
}

function getNodes() {
  return nodes;
}

function getSyntaxes(getMedia) {
  processMediaProxyPlugins(getMedia);
  return { markdown: augmentedMarkdownSyntax, html:augmentedHTMLSyntax };
}

export { processEditorPlugins, getNodes, getSyntaxes, getPlugins };
