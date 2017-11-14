import PropTypes from 'prop-types';
import React from 'react';

export default function StringPreview({ value }) {
  return <div className="nc-widgetPreview">{ value }</div>;
}

StringPreview.propTypes = {
  value: PropTypes.node,
};
