import React, { PropTypes } from "react";
import { renderToStaticMarkup } from 'react-dom/server';
import { Map } from 'immutable';
import unified from 'unified';
import markdown from 'remark-parse';
import rehype from 'remark-rehype';
import parseHtml from 'rehype-parse';
import html from 'rehype-stringify';
import registry from "../../lib/registry";

const getPlugins = () => registry.getEditorComponents();

const renderEditorPlugins = ({ getAsset }) => {
  return tree => {
    const result = renderEditorPluginsProcessor(tree, getAsset);
    return result;
  };
};

const renderEditorPluginsProcessor = (node, getAsset) => {

  if (node.children) {

    node.children = node.children.map(n => renderEditorPluginsProcessor(n, getAsset));

    // Handle externally defined plugins (they'll be wrapped in paragraphs)
    if (node.tagName === 'p' && node.children.length === 1 && node.children[0].type === 'text') {
      const value = node.children[0].value;
      const plugin = getPlugins().find(plugin => plugin.get('pattern').test(value));
      if (plugin) {
        const data = plugin.get('fromBlock')(value.match(plugin.get('pattern')));
        const preview = plugin.get('toPreview')(data);
        const output = typeof preview === 'string' ?
          <div dangerouslySetInnerHTML={{ __html: preview }}/> :
          preview;

        const result = unified()
          .use(parseHtml, { fragment: true })
          .parse(renderToStaticMarkup(output));

        return result.children[0];
      }
    }
  }

  // Handle the internally defined image plugin. At this point the token has
  // already been parsed as an image by Remark, so we have to catch it by
  // checking for the 'image' type.
  if (node.tagName === 'img') {
    const { src, alt } = node.properties;

    // Until we improve the editor components API for built in components,
    // we'll mock the result of String.prototype.match to pass in to the image
    // plugin's fromBlock method.
    const plugin = getPlugins().get('image');
    if (plugin) {
      const matches = [ , alt, src ];
      const data = plugin.get('fromBlock')(matches);
      const extendedData = { ...data, image: getAsset(data.image).toString() };
      const preview = plugin.get('toPreview')(extendedData);
      const output = typeof preview === 'string' ?
        <div dangerouslySetInnerHTML={{ __html: preview }}/> :
        preview;

      const result = unified()
        .use(parseHtml, { fragment: true })
        .parse(renderToStaticMarkup(output));

      return result.children[0];
    }
  }

  return node;
};

const MarkupItReactRenderer = ({ value, getAsset }) => {
  const doc = unified()
    .use(markdown, { commonmark: true, footnotes: true, pedantic: true })
    .use(rehype, { allowDangerousHTML: true })
    .use(renderEditorPlugins, { getAsset })
    .use(html, { allowDangerousHTML: true })
    .processSync(value);

  return <div dangerouslySetInnerHTML={{ __html: doc }} />; // eslint-disable-line react/no-danger
}

export default MarkupItReactRenderer;

MarkupItReactRenderer.propTypes = {
  value: PropTypes.string,
  getAsset: PropTypes.func.isRequired,
};
