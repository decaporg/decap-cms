import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';

const FileLink = styled(({ href, path }) => (
  <a href={href} rel="noopener noreferrer" target="_blank">
    {path}
  </a>
))`
  display: block;
`;

function FileLinkList({ values, getAsset, field }) {
  return (
    <div>
      {values.map(value => (
        <FileLink key={value} path={value} href={getAsset(value, field)} />
      ))}
    </div>
  );
}

function FileContent(props) {
  const { value, getAsset, field } = props;
  if (Array.isArray(value) || List.isList(value)) {
    return <FileLinkList values={value} getAsset={getAsset} field={field} />;
  }
  return <FileLink key={value} path={value} href={getAsset(value, field)} />;
}

function FilePreview(props) {
  return (
    <WidgetPreviewContainer>
      {props.value ? <FileContent {...props} /> : null}
    </WidgetPreviewContainer>
  );
}

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default FilePreview;
