import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const FileLink = styled(({ href, path }) => (
  <a href={href} rel="noopener noreferrer" target="_blank">
    {path}
  </a>
))`
  display: block;
`;

function FileLinkList({ values, getAsset, folder }) {
  return (
    <div>
      {values.map(value => (
        <FileLink key={value} path={value} href={getAsset(value, folder)} />
      ))}
    </div>
  );
}

function FileContent(props) {
  const { value, getAsset, field } = props;
  const folder = field.get('media_folder');

  if (Array.isArray(value) || List.isList(value)) {
    return <FileLinkList values={value} getAsset={getAsset} folder={folder} />;
  }
  return <FileLink key={value} path={value} href={getAsset(value, folder)} />;
}

const FilePreview = props => (
  <WidgetPreviewContainer>{props.value ? <FileContent {...props} /> : null}</WidgetPreviewContainer>
);

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default FilePreview;
