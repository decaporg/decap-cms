import React, { PropTypes } from 'react';

export default function TextPreview({ value }) {
  return <div>{value ? value.toString() : null}</div>;
}

TextPreview.propTypes = {
  value: PropTypes.node,
};
