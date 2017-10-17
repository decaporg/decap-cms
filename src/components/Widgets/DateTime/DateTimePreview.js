import PropTypes from 'prop-types';
import React from 'react';
import previewStyle from '../defaultPreviewStyle';

export default function DateTimePreview({ value }) {
  return <div style={previewStyle}>{value ? value.toString() : null}</div>;
}

DateTimePreview.propTypes = {
  value: PropTypes.object,
};
