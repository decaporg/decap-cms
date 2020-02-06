import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer, Asset } from 'netlify-cms-ui-default';

const StyledImage = styled(({ value: src }) => <img src={src || ''} role="presentation" />)`
  display: block;
  max-width: 100%;
  height: auto;
`;

const StyledImageAsset = ({ getAsset, value, field }) => {
  return (
    <Asset
      folder={field.getIn(['media_library', 'config', 'media_folder'])}
      path={value}
      getAsset={getAsset}
      component={StyledImage}
    />
  );
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
