import React, { PropTypes } from 'react';

export default function DatePreview({ value }) {
  return <span>{value ? value.toString() : null}</span>;
}

DatePreview.propTypes = {
  value: PropTypes.node,
};
