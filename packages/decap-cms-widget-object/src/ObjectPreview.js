import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';
import { fromJS } from 'immutable';

function ObjectPreview({ field }) {
  if (field && !field.get) {
    field = fromJS(field);
  }
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
