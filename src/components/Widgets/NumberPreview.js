import React, { PropTypes } from 'react';

export default function StringPreview({ value }) {
  return <span>{value}</span>;
}

StringPreview.propTypes = {
  value: PropTypes.node,
};
