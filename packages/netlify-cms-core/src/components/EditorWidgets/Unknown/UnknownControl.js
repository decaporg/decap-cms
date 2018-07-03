import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

export default function UnknownControl({ field }) {
  return <div>No control for widget '{field.get('widget')}'.</div>;
}

UnknownControl.propTypes = {
  field: ImmutablePropTypes.map,
};
