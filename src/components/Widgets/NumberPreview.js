import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function NumberPreview({ value }) {
  return <div style={previewStyle}>{value}</div>;
}

NumberPreview.propTypes = {
  value: PropTypes.node,
};
