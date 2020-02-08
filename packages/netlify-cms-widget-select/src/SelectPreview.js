import PropTypes from 'prop-types';
import React from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { WidgetPreviewContainer } from 'netlify-cms-ui-legacy';

const ListPreview = ({ values }) => (
  <ul>
    {values.map((value, idx) => (
      <li key={idx}>{value}</li>
    ))}
  </ul>
);

const SelectPreview = ({ value }) => (
  <WidgetPreviewContainer>
    {value && (List.isList(value) ? <ListPreview values={value} /> : value)}
    {!value && null}
  </WidgetPreviewContainer>
);

SelectPreview.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, ImmutablePropTypes.list]),
};

export default SelectPreview;
