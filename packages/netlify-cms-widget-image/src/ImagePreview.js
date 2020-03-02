import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer } from 'netlify-cms-ui-legacy';

const StyledImage = styled(({ src }) => <img src={src || ''} role="presentation" />)`
  display: block;
  max-width: 100%;
  height: auto;
`;

const StyledImageAsset = ({ getAsset, value, field }) => {
  return <StyledImage src={getAsset(value, field)} />;
};

const ImagePreviewContent = props => {
  const { value, getAsset, field } = props;
  if (Array.isArray(value) || List.isList(value)) {
    return value.map(val => (
      <StyledImageAsset key={val} value={val} getAsset={getAsset} field={field} />
    ));
  }
  return <StyledImageAsset {...props} />;
};

const ImagePreview = props => {
  return (
    <WidgetPreviewContainer>
      {props.value ? <ImagePreviewContent {...props} /> : null}
    </WidgetPreviewContainer>
  );
};

ImagePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default ImagePreview;
