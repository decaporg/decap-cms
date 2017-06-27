import React, { PropTypes } from 'react';
import previewStyle from '../../defaultPreviewStyle';

const MarkdownPreview = ({ value, getAsset }) => {
  return value === null ? null : <div style={previewStyle} dangerouslySetInnerHTML={{__html: value}}></div>;
};

MarkdownPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default MarkdownPreview;
