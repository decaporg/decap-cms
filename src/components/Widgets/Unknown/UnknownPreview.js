import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

export default function UnknownPreview({ field }) {
  return <div className='nc-widgetPreview'>No preview for widget “{field.get('widget')}”.</div>;
}

UnknownPreview.propTypes = {
  field: ImmutablePropTypes.map,
};
