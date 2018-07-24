import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const Image = styled.img`
  max-width: 100%;
  height: auto;
`

const ImagePreview = ({ value, getAsset }) => (
  <WidgetPreviewContainer>
    { value ? <Image src={getAsset(value)} role="presentation"/> : null}
  </WidgetPreviewContainer>
);

ImagePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default ImagePreview;
