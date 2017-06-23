import React, { PropTypes } from "react";
import { renderToStaticMarkup } from 'react-dom/server';
import { Map } from 'immutable';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import unified from 'unified';
import htmlToRehype from 'rehype-parse';
import registry from "../../../../lib/registry";

const cmsPluginRehype = ({ getAsset }) => {

  const plugins = registry.getEditorComponents();

  return transform;

  function transform(node) {
    // Handle externally defined plugins (they'll be wrapped in paragraphs)
    if (node.tagName === 'p' && node.children.length === 1) {
      if (node.children[0].type === 'text') {
        const value = node.children[0].value;
        const plugin = plugins.find(plugin => plugin.get('pattern').test(value));
        if (plugin) {
          const data = plugin.get('fromBlock')(value.match(plugin.get('pattern')));
          const preview = plugin.get('toPreview')(data);
          const output = `<div>${isString(preview) ? preview : renderToStaticMarkup(preview)}</div>`;
          return unified().use(htmlToRehype, { fragment: true }).parse(output).children[0];
        }
      }

      // Handle the internally defined image plugin. At this point the token has
      // already been parsed as an image by Remark, so we have to catch it by
      // checking for the 'image' type.
      if (node.children[0].tagName === 'img') {
        const { src, alt } = node.children[0].properties;

        // Until we improve the editor components API for built in components,
        // we'll mock the result of String.prototype.match to pass in to the image
        // plugin's fromBlock method.
        const plugin = plugins.get('image');
        if (plugin) {
          const matches = [ , alt, src ];
          const data = plugin.get('fromBlock')(matches);
          const extendedData = { ...data, image: getAsset(data.image).toString() };
          const preview = plugin.get('toPreview')(extendedData);
          const output = `<div>${isString(preview) ? preview : renderToStaticMarkup(preview)}</div>`;
          return unified().use(htmlToRehype, { fragment: true }).parse(output).children[0];
        }
      }
    }

    if (!isEmpty(node.children)) {
      node.children = node.children.map(childNode => transform(childNode, getAsset));
    }

    return node;
  }
};

export default cmsPluginRehype;
