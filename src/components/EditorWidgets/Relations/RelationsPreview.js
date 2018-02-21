import PropTypes from 'prop-types';
import React from 'react';

export default function RelationsPreview({ value, field }) {
  return (
    <div className="nc-widgetPreview">
      {value.map(val =>
        <span>{val}</span>
        )
      }
    </div>
  );
}

RelationsPreview.propTypes = {
  value: PropTypes.node,
  field: PropTypes.node,
};
