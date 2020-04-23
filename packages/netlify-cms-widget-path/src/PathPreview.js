import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const PathPreview = ({ value }) => <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;

PathPreview.propTypes = {
  value: PropTypes.node,
};

export default PathPreview;
