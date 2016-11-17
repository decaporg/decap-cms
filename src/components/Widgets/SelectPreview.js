import React, { PropTypes } from 'react';

export default function SelectPreview({ value }) {
  return <span>{value ? value.toString() : null}</span>;
}

SelectPreview.propTypes = {
  value: PropTypes.string,
};
