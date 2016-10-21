import React, { PropTypes } from 'react';

export default function ListPreview({ value }) {
  return (<ul>
    { value && value.map(item => <li key={item}>{item}</li>) }
  </ul>);
}

ListPreview.propTypes = {
  value: PropTypes.node,
};
