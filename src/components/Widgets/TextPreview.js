import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function TextPreview({ value }) {
  return <div style={previewStyle}>{value ? value.toString() : null}</div>;
}

TextPreview.propTypes = {
  value: PropTypes.node,
};
