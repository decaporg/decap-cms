import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';

const StyledImage = styled(({ src }) => <img src={src || ''} role="presentation" />)`
  display: block;
  max-width: 100%;
  height: auto;
`;

function StyledImageAsset({ getAsset, value, field }) {
  let src = '';
  if (value instanceof File) {
    src = URL.createObjectURL(value);
  } else {
    src = getAsset(value, field);
  }
  return <StyledImage src={src} />;
}

function ImagePreviewContent(props) {
  const { value, getAsset, field } = props;
  if (Array.isArray(value) || List.isList(value)) {
    return value.map((val, index) => (
      <StyledImageAsset key={index} value={val} getAsset={getAsset} field={field} />
    ));
  }
  return <StyledImageAsset {...props} />;
}

function ImagePreview(props) {
  return (
    <WidgetPreviewContainer>
      {props.value ? <ImagePreviewContent {...props} /> : null}
    </WidgetPreviewContainer>
  );
}

ImagePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default ImagePreview;
