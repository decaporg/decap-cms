import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default/src';

const stringify = (value = null) => (Array.isArray(value) ? value.join(', ') : value);
const CustomRelationPreview = ({ value } = {}) => (
  <WidgetPreviewContainer>{stringify(value)}</WidgetPreviewContainer>
);

CustomRelationPreview.propTypes = {
  value: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
};

export default CustomRelationPreview;
