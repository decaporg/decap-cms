import React, { PropTypes } from 'react';
import previewStyle from './defaultPreviewStyle';

export default function TextPreview({ value }) {
  return <div dangerouslySetInnerHTML={{ __html: value ? value.toString() : null }} />;
}

TextPreview.propTypes = {
  value: PropTypes.node,
};
