import React, { PropTypes } from 'react';
import { remarkToHtml } from '../unified';
import previewStyle from '../../defaultPreviewStyle';

const MarkdownPreview = ({ value, getAsset }) => {
  if (value === null) {
    return null;
  }
  const html = remarkToHtml(value, getAsset);
  return <div style={previewStyle} dangerouslySetInnerHTML={{__html: html}}></div>;
};

MarkdownPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.object,
};

export default MarkdownPreview;
