import React, { PropTypes } from 'react';
import MarkupIt, { Syntax, JSONUtils } from 'markup-it';

const defaultRenderers = {
  'doc': 'article',
  'header_one': 'h1',
  'header_two': 'h2',
  'header_three': 'h3',
  'header_four': 'h4',
  'header_five': 'h5',
  'header_six': 'h6',
  'paragraph': 'p',
  'ordered_list': 'ol',
  'unordered_list': 'ul',
  'list_item': 'li',
  'link': 'a',
  'image': 'img',
  'BOLD': 'strong',
  'ITALIC': 'em',
  'text': null,
  'unstyled': null,
};

export default class MarkitupReactRenderer extends React.Component {

  renderToken = (token) => {
    const { type, data, text, tokens } = token;
    const element = defaultRenderers[type];

    // Only render if type is registered as renderer
    if (typeof element !== 'undefined') {
      let children = null;
      if (Array.isArray(tokens) && tokens.length) {
        children = tokens.map(this.renderToken);
      } else if (type === 'text') {
        children = text;
      }
      if (element !== null) {
        // If this is a react element
        return React.createElement(element, data, children);
      } else {
        // If this is a text node
        return children;
      }
    }
    return null;
  }

  render() {
    const { value, syntax } = this.props;

    if (typeof this.parser === 'undefined') {
      this.parser = new MarkupIt(syntax);
    }

    const content = this.parser.toContent(value);
    const json = JSONUtils.encode(content);
    // console.log(JSON.stringify(json, null, 2));

    return (
      <div>{this.renderToken(json.token)}</div>
    );
  }
}

MarkitupReactRenderer.propTypes = {
  value: PropTypes.string,
  syntax: PropTypes.instanceOf(Syntax).isRequired
};
