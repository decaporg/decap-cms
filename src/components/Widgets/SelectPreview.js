import React, { PropTypes } from 'react';

export default function SelectPreview({ value }) {
  return <div>{value ? value.toString() : null}</div>;
}

SelectPreview.propTypes = {
  value: PropTypes.string,
};
