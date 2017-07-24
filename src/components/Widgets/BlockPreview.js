import React, { PropTypes, Component } from 'react';
import { resolveWidget } from '../Widgets';
import previewStyle from './defaultPreviewStyle';

const BlockPreview = ({ field }) => (
  <div style={previewStyle}>{(field && field.get('fields')) || null}</div>
);

BlockPreview.propTypes = {
  field: PropTypes.node,
};

export default BlockPreview;
