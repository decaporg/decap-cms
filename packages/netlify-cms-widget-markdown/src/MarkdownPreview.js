import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';
import { markdownToHtml } from './serializers';
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
class MarkdownPreview extends React.Component {
  static propTypes = {
    getAsset: PropTypes.func.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    value: PropTypes.string,
  };

  render() {
    const { value, getAsset, resolveWidget } = this.props;
    if (value === null) {
      return null;
    }

    const html = DOMPurify.sanitize(markdownToHtml(value, { getAsset, resolveWidget }));

    return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: html }} />;
  }
}

export default MarkdownPreview;
