import PropTypes from 'prop-types';
import React from 'react';

export default function TextPreview({ value }) {
  return <div className="nc-widgetPreview">{value}</div>;
}

TextPreview.propTypes = {
  value: PropTypes.node,
};
