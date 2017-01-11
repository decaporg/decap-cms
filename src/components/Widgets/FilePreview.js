import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function FilePreview({ value, getAsset }) {
  return (<div style={previewStyle}>
    { value ?
      <a href={getAsset(value)}>{ value }</a>
      : null}
  </div>);
}

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};
