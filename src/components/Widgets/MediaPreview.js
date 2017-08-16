import React, { PropTypes } from 'react';
import previewStyle, { imagePreviewStyle } from './defaultPreviewStyle';

export default function MediaPreview({ value, getAsset }) {
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

MediaPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};
