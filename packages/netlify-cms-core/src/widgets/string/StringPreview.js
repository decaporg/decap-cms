import React from 'react';
import PropTypes from 'prop-types';

import { WidgetPreviewContainer } from '../../ui';

function StringPreview({ value }) {
  return <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;
}

StringPreview.propTypes = {
  value: PropTypes.node,
};

export default StringPreview;
