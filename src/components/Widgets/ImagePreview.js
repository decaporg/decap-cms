import React, { PropTypes } from 'react';

const style = {
  width: '100%',
  height: 'auto',
};

export default function ImagePreview({ value, getMedia }) {
  return (<div>
    { value ?
      <img
        src={getMedia(value)}
        style={style}
        role="presentation"
      />
      : null}
  </div>);
}

ImagePreview.propTypes = {
  getMedia: PropTypes.func.isRequired,
  value: PropTypes.node,
};
