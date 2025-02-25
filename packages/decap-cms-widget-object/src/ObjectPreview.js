import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';

function ObjectPreview({ field }) {
  return (
    <WidgetPreviewContainer>
      {(field && field.get('fields')) || field.get('field') || null}
    </WidgetPreviewContainer>
  );
}

ObjectPreview.propTypes = {
  field: ImmutablePropTypes.map,
};

export default ObjectPreview;
