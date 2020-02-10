import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-legacy';

const TextPreview = ({ value }) => <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;

TextPreview.propTypes = {
  value: PropTypes.node,
};

export default TextPreview;
