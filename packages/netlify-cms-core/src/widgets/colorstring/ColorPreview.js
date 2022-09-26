import React from 'react';
import PropTypes from 'prop-types';

import { WidgetPreviewContainer } from '../../ui';

function ColorPreview({ value }) {
  return <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;
}

ColorPreview.propTypes = {
  value: PropTypes.node,
};

export default ColorPreview;
