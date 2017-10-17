import PropTypes from 'prop-types';
import React from 'react';
import previewStyle from '../defaultPreviewStyle';

export default function RelationPreview({ value }) {
  return <div style={previewStyle}>{ value }</div>;
}

RelationPreview.propTypes = {
  value: PropTypes.node,
};
