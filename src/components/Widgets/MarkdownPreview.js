import React, { PropTypes } from 'react';
import MarkupIt from 'markup-it';
import { getSyntaxes } from './richText';

export default class MarkdownPreview extends React.Component {

  constructor(props) {
    super(props);

    const { markdown, html } = getSyntaxes();
    this.markdown = new MarkupIt(markdown);
    this.html = new MarkupIt(html);
  }
  render() {
    const { value } = this.props;
    if (value == null) { return null; }
    const content = this.markdown.toContent(value);
    const contentHtml =  { __html: this.html.toText(content) };

    return (
      <div dangerouslySetInnerHTML={contentHtml} />
    );
  }
}

MarkdownPreview.propTypes = {
  value: PropTypes.node,
};
