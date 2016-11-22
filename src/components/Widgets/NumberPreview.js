import React, { PropTypes } from 'react';

export default function NumberPreview({ value }) {
  return <div>{value ? value.toString() : null}</div>;
}

NumberPreview.propTypes = {
  value: PropTypes.node,
};
