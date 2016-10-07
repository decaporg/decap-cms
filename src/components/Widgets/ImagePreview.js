import React, { PropTypes } from 'react';

export default function ImagePreview({ value, getMedia }) {
  return (<span>
    {value ? <img src={getMedia(value)} /> : null}
  </span>);
}

ImagePreview.propTypes = {
  getMedia: PropTypes.func.isRequired,
  value: PropTypes.node,
};
