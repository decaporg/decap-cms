import React, { PropTypes, Component } from 'react';
import { resolveWidget } from '../Widgets';
import previewStyle from './defaultPreviewStyle';

const DynamicPreview = ({ field }) => (
  <div style={previewStyle}>{(field && field.get('fields')) || null}</div>
);

DynamicPreview.propTypes = {
  field: PropTypes.node,
};

export default DynamicPreview;
