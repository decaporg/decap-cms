import React, { PropTypes } from 'react';
import { markdownToHtml } from '../serializers';
import previewStyle from '../../defaultPreviewStyle';

const MarkdownPreview = ({ value, getAsset }) => {
  if (value === null) {
    return null;
  }
  const html = markdownToHtml(value, getAsset);
  return <div style={previewStyle} dangerouslySetInnerHTML={{__html: html}}></div>;
};

MarkdownPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default MarkdownPreview;
