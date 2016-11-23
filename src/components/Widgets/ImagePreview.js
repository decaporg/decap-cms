import React, { PropTypes } from 'react';
import previewStyle, { imagePreviewStyle } from './defaultPreviewStyle';

export default function ImagePreview({ value, getMedia }) {
  return (<div style={previewStyle}>
    { value ?
      <img
        src={getMedia(value)}
        style={imagePreviewStyle}
        role="presentation"
      />
      : null}
  </div>);
}

ImagePreview.propTypes = {
  getMedia: PropTypes.func.isRequired,
  value: PropTypes.node,
};
