import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function DatePreview({ value }) {
  return <div style={previewStyle}>{value ? value.toString() : null}</div>;
}

DatePreview.propTypes = {
  value: PropTypes.object,
};
