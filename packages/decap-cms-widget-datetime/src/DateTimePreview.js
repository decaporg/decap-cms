import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';

function DatePreview({ value }) {
  return <WidgetPreviewContainer>{value ? value.toString() : null}</WidgetPreviewContainer>;
}

DatePreview.propTypes = {
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

export default DatePreview;
