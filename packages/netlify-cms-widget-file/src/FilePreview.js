import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer, Asset } from 'netlify-cms-ui-default';

const FileLink = styled(({ value: href, path }) => (
  <a href={href} rel="noopener noreferrer" target="_blank">
    {path}
  </a>
))`
  display: block;
`;

const FileLinkAsset = ({ value, getAsset }) => {
  return <Asset path={value} getAsset={getAsset} component={FileLink} />;
};

function FileLinkList({ values, getAsset }) {
  return (
    <div>
      {values.map(value => (
        <FileLinkAsset key={value} value={value} getAsset={getAsset} />
      ))}
    </div>
  );
}

function FileContent({ value, getAsset }) {
  if (Array.isArray(value) || List.isList(value)) {
    return <FileLinkList values={value} getAsset={getAsset} />;
  }
  return <FileLinkAsset value={value} getAsset={getAsset} />;
}

const FilePreview = props => (
  <WidgetPreviewContainer>{props.value ? <FileContent {...props} /> : null}</WidgetPreviewContainer>
);

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default FilePreview;
