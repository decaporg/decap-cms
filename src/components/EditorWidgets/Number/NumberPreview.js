import PropTypes from 'prop-types';
import React from 'react';

export default function NumberPreview({ value }) {
  return <div className="nc-widgetPreview">{value}</div>;
}

NumberPreview.propTypes = {
  value: PropTypes.node,
};
