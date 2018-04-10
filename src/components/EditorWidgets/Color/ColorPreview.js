import PropTypes from 'prop-types';
import React from 'react';

export default function ColorPreview({ value }) {
  return <div className="nc-widgetPreview">{ value }</div>;
}

ColorPreview.propTypes = {
  value: PropTypes.node,
};
