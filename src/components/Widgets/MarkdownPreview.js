import React from 'react';
import CommonMark from 'commonmark';
import ReactRenderer from 'commonmark-react-renderer';

const parser = new CommonMark.Parser();
const renderer = new ReactRenderer();

export default class MarkdownPreview extends React.Component {
  render() {
    const { value } = this.props;
    if (value == null) { return null; }

    const ast = parser.parse(value);
    return React.createElement.apply(React, ['div', {}].concat(renderer.render(ast)));
  }
}
