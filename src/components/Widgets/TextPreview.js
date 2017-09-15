import PropTypes from 'prop-types';
import React from 'react';
import previewStyle from './defaultPreviewStyle';

export default function TextPreview({ value }) {
  return <div style={previewStyle}>{value}</div>;
}

TextPreview.propTypes = {
  value: PropTypes.node,
};
