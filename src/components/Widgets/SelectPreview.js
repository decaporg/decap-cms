import PropTypes from 'prop-types';
import React from 'react';
import previewStyle from './defaultPreviewStyle';

export default function SelectPreview({ value }) {
  return <div style={previewStyle}>{value ? value.toString() : null}</div>;
}

SelectPreview.propTypes = {
  value: PropTypes.string,
};
