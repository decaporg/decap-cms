import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-legacy';
import { markdownToHtml } from './serializers';

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

    const html = markdownToHtml(value, { getAsset, resolveWidget });

    return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: html }} />;
  }
}

export default MarkdownPreview;
