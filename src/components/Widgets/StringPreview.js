import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function StringPreview({ value }) {
  return <div style={previewStyle}>{ value }</div>;
}

StringPreview.propTypes = {
  value: PropTypes.node,
};
