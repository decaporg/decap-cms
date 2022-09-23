import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

function MapPreview({ value }) {
  return <WidgetPreviewContainer>{value ? value.toString() : null}</WidgetPreviewContainer>;
}

MapPreview.propTypes = {
  value: PropTypes.string,
};

export default MapPreview;
