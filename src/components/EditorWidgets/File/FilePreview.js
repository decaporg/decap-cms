import PropTypes from 'prop-types';
import React from 'react';

export default function FilePreview({ value, getAsset }) {
  return (<div className="nc-widgetPreview">
    { value ?
      <a href={getAsset(value)}>{ value }</a>
      : null}
  </div>);
}

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};
