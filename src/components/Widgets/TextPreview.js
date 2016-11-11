import React, { PropTypes } from 'react';

export default function TextPreview({ value }) {
  return <span>{value ? value.toString() : null}</span>;
}

TextPreview.propTypes = {
  value: PropTypes.node,
};
