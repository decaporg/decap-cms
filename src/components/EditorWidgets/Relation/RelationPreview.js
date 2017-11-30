import PropTypes from 'prop-types';
import React from 'react';

export default function RelationPreview({ value }) {
  return <div className="nc-widgetPreview">{ value }</div>;
}

RelationPreview.propTypes = {
  value: PropTypes.node,
};
