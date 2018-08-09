import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';
import { markdownToHtml } from './serializers';

const MarkdownPreview = ({ value, getAsset }) => {
  if (value === null) {
    return null;
  }
  const html = markdownToHtml(value, getAsset);
  return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: html }} />;
};

MarkdownPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default MarkdownPreview;
