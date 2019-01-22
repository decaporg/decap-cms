import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const stringify = (value = null) => (Array.isArray(value) ? value.join(', ') : value);
const SlugRelationPreview = ({ value } = {}) => (
  <WidgetPreviewContainer>{stringify(value)}</WidgetPreviewContainer>
);

SlugRelationPreview.propTypes = {
  value: PropTypes.array,
};

export default SlugRelationPreview;
