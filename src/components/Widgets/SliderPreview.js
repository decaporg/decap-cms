import React, { PropTypes, Component } from 'react';
import { resolveWidget } from '../Widgets';
import previewStyle from './defaultPreviewStyle';

const SliderPreview = ({ field }) => (
  <div style={previewStyle}>{(field && field.get('fields')) || null}</div>
);

SliderPreview.propTypes = {
  field: PropTypes.node,
};

export default SliderPreview;
