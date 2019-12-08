import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

export const useGetAssetEffect = ({ getAsset, value, setCallback }) => {
  useEffect(() => {
    let subscribed = true;

    getAsset(value).then(url => subscribed && setCallback(url));

    return () => {
      subscribed = false;
    };
  }, [getAsset, value]);
};

const FileLink = styled(({ value, getAsset }) => {
  const [href, setHref] = useState();

  useGetAssetEffect({ getAsset, value, setCallback: setHref });

  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {value}
    </a>
  );
})`
  display: block;
`;

function FileLinkList({ values, getAsset }) {
  return (
    <div>
      {values.map(value => (
        <FileLink key={value} value={value} getAsset={getAsset} />
      ))}
    </div>
  );
}

function FileContent({ value, getAsset }) {
  if (Array.isArray(value) || List.isList(value)) {
    return <FileLinkList values={value} getAsset={getAsset} />;
  }
  return <FileLink value={value} getAsset={getAsset} />;
}

const FilePreview = props => (
  <WidgetPreviewContainer>{props.value ? <FileContent {...props} /> : null}</WidgetPreviewContainer>
);

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default FilePreview;
