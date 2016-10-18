import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

export default function Preview({ collection, widgetFor }) {
  if (!collection) {
    return null;
  }

  return (
    <div>
      {collection.get('fields').map(field => widgetFor(field.get('name')))}
    </div>
  );
}

Preview.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
  widgetFor: PropTypes.func.isRequired,
};
