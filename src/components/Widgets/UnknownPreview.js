import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import previewStyle from './defaultPreviewStyle';

export default function UnknownPreview({ field }) {
  return <div style={previewStyle}>No preview for widget “{field.get('widget')}”.</div>;
}

UnknownPreview.propTypes = {
  field: ImmutablePropTypes.map,
};
