import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

function isVisible(field) {
  return field.get('widget') !== 'hidden';
}

export default function Preview({ collection, fields, widgetFor }) {
  if (!collection || !fields) {
    return null;
  }
  return (
    <div>
      {fields.filter(isVisible).map(field => widgetFor(field.get('name')))}
    </div>
  );
}

Preview.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  getMedia: PropTypes.func.isRequired,
  widgetFor: PropTypes.func.isRequired,
};
