import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

function UuidPreview({ value }) {
  return <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;
}

UuidPreview.propTypes = {
  value: PropTypes.node,
};

export default UuidPreview;
