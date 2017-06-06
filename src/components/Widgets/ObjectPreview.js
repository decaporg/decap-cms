import React, { PropTypes, Component } from 'react';
import { resolveWidget } from '../Widgets';
import previewStyle from './defaultPreviewStyle';

const ObjectPreview = ({ field }) => (
  <div style={previewStyle}>{(field && field.get('fields')) || null}</div>
);

ObjectPreview.propTypes = {
  value: PropTypes.node,
  field: PropTypes.node,
  getAsset: PropTypes.func.isRequired,
};

export default ObjectPreview;
