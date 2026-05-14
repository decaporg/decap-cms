import React from 'react';
import PropTypes from 'prop-types';
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
  field: PropTypes.node,
};

export default ObjectPreview;
