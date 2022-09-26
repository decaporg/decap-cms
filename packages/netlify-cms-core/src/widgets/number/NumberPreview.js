import React from 'react';
import PropTypes from 'prop-types';

import { WidgetPreviewContainer } from '../../ui';

function NumberPreview({ value }) {
  return <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;
}

NumberPreview.propTypes = {
  value: PropTypes.node,
};

export default NumberPreview;
