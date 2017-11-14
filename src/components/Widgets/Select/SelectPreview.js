import PropTypes from 'prop-types';
import React from 'react';

export default function SelectPreview({ value }) {
  return <div className="nc-widgetPreview">{value ? value.toString() : null}</div>;
}

SelectPreview.propTypes = {
  value: PropTypes.string,
};
