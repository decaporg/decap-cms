import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function SelectPreview({ value }) {
  return <div style={previewStyle}>{value ? value.toString() : null}</div>;
}

SelectPreview.propTypes = {
  value: PropTypes.string,
};
