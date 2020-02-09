import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-legacy';

const MapPreview = ({ value }) => (
  <WidgetPreviewContainer>{value ? value.toString() : null}</WidgetPreviewContainer>
);

MapPreview.propTypes = {
  value: PropTypes.string,
};

export default MapPreview;
