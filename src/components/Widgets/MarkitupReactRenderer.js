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

function renderToken(token, index = 0, key = '0') {
  const { type, data, text, tokens } = token;
  const element = defaultRenderers[type];
  key = `${key}.${index}`;

  // Only render if type is registered as renderer
  if (typeof element !== 'undefined') {
    let children = null;
    if (Array.isArray(tokens) && tokens.length) {
      children = tokens.map((token, idx) => renderToken(token, idx, key));
    } else if (type === 'text') {
      children = text;
    }
    if (element !== null) {
      // If this is a react element
      return React.createElement(
        element,
        { key, ...data }, // Add key as a prop
        Array.isArray(children) && children.length === 1
          ? children[0] : children); // Pass single child if possible
    } else {
      // If this is a text node
      return children;
    }
  }
  return null;
}

export default class MarkitupReactRenderer extends React.Component {

  constructor(props) {
    super(props);
    const { syntax } = props;
    this.parser = new MarkupIt(syntax);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.syntax != this.props.syntax) {
      this.parser = new MarkupIt(nextProps.syntax);
    }
  }

  render() {
    const { value } = this.props;
    const content = this.parser.toContent(value);
    const json = JSONUtils.encode(content);
    // console.log(JSON.stringify(json, null, 2));

    return renderToken(json.token);
  }
}

MarkitupReactRenderer.propTypes = {
  value: PropTypes.string,
  syntax: PropTypes.instanceOf(Syntax).isRequired
};
