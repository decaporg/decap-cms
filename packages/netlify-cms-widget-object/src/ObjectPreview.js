import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-legacy';

const ObjectPreview = ({ field }) => (
  <WidgetPreviewContainer>
    {(field && field.get('fields')) || field.get('field') || null}
  </WidgetPreviewContainer>
);

ObjectPreview.propTypes = {
  field: PropTypes.node,
};

export default ObjectPreview;
