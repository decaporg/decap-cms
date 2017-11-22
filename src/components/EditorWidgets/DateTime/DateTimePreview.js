import PropTypes from 'prop-types';
import React from 'react';

export default function DateTimePreview({ value }) {
  return <div className="nc-widgetPreview">{value ? value.toString() : null}</div>;
}

DateTimePreview.propTypes = {
  value: PropTypes.object,
};
