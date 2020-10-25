import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const ColorPreview = ({ value }) => <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;

ColorPreview.propTypes = {
  value: PropTypes.node,
};

export default ColorPreview;
