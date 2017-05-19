import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function TextPreview({ value }) {
  return <div style={previewStyle}>{value}</div>;
}

TextPreview.propTypes = {
  value: PropTypes.node,
};
