import React, { PropTypes } from 'react';

export default function StringPreview({ value }) {
  return <span>{value ? value.toString() : null}</span>;
}

StringPreview.propTypes = {
  value: PropTypes.node,
};
