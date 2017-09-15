import PropTypes from 'prop-types';
import React from 'react';
import previewStyle from './defaultPreviewStyle';

export default function NumberPreview({ value }) {
  return <div style={previewStyle}>{value}</div>;
}

NumberPreview.propTypes = {
  value: PropTypes.node,
};
