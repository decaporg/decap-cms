import PropTypes from 'prop-types';
import React from 'react';

export default function DatePreview({ value }) {
  return <div className="nc-widgetPreview">{value ? value.toString() : null}</div>;
}

DatePreview.propTypes = {
  value: PropTypes.object,
};
