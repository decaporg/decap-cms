import React, { PropTypes } from 'react';
import previewStyle, { imagePreviewStyle } from './defaultPreviewStyle';

export default function ImagePreview({ value, getAsset }) {
  return (<div style={previewStyle}>
    { value ?
      <img
        src={getAsset(value)}
        style={imagePreviewStyle}
        role="presentation"
      />
      : null}
  </div>);
}

ImagePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};
