import PropTypes from 'prop-types';
import React from 'react';

export default function MultiSelectPreview({ value }) {
  return <div className="nc-widgetPreview">{value ? value.toString() : null}</div>;
}

MultiSelectPreview.propTypes = {
};
