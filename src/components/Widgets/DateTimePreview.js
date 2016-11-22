import React, { PropTypes } from 'react';

export default function DatePreview({ value }) {
  return <div>{value ? value.toString() : null}</div>;
}

DatePreview.propTypes = {
  value: PropTypes.node,
};
