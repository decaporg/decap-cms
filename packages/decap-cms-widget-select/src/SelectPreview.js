import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';

function ListPreview({ values }) {
  return (
    <ul>
      {values.map((value, idx) => (
        <li key={idx}>{value}</li>
      ))}
    </ul>
  );
}

function SelectPreview({ value }) {
  return (
    <WidgetPreviewContainer>
      {value && (List.isList(value) ? <ListPreview values={value} /> : value)}
      {!value && null}
    </WidgetPreviewContainer>
  );
}

SelectPreview.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, ImmutablePropTypes.list]),
};

export default SelectPreview;
