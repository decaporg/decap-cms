import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const FilePreview = ({ value, getAsset }) => (
  <WidgetPreviewContainer>
    { value ? <a href={getAsset(value)}>{ value }</a> : null}
  </WidgetPreviewContainer>
);

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default FilePreview;
