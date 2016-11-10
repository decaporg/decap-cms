import React, { PropTypes } from 'react';

export default function NumberPreview({ value }) {
  return <span>{value ? value.toString() : null}</span>;
}

NumberPreview.propTypes = {
  value: PropTypes.node,
};
