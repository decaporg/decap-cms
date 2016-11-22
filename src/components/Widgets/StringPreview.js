import React, { PropTypes } from 'react';

export default function StringPreview({ value }) {
  return <div>{ value }</div>;
}

StringPreview.propTypes = {
  value: PropTypes.node,
};
