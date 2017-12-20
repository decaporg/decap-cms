import PropTypes from 'prop-types';
import React from 'react';

export default function ImagePreview({ value, getAsset }) {
  return (<div className='nc-widgetPreview'>
    { value ?
      <img
        src={getAsset(value)}
        className='nc-imageWidget-image'
        role="presentation"
      />
      : null}
  </div>);
}

ImagePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};
