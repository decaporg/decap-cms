import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';
import { TYPES_KEY } from 'netlify-cms-lib-util';

const ObjectPreview = ({ field }) => (
  <WidgetPreviewContainer>
    <div>{field.get('label', field.get('name'))}</div>
    {(field && (field.get(TYPES_KEY) || field.get('fields') || field.get('field'))) || null}
  </WidgetPreviewContainer>
);

ObjectPreview.propTypes = {
  field: PropTypes.node,
};

export default ObjectPreview;
