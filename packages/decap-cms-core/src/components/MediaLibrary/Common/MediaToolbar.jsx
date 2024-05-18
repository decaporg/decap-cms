import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { AppBar, FileUploadButton } from 'decap-cms-ui-next';

import MediaSearchBar from './MediaSearchBar';

const MediaToolbarWrap = styled(AppBar)`
  height: 80px;
  padding: 0 1rem;
  background-color: transparent;

  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

function MediaToolbar({
  t,
  onUpload,
  imagesOnly,
  query,
  onSearchChange,
  onSearchKeyDown,
  searchDisabled,
  uploadEnabled,
  uploadButtonLabel,
}) {
  return (
    <MediaToolbarWrap
      renderStart={() => (
        <MediaSearchBar
          value={query}
          onChange={onSearchChange}
          onKeyDown={onSearchKeyDown}
          placeholder={t('mediaLibrary.mediaLibraryModal.search')}
          disabled={searchDisabled}
        />
      )}
      renderEnd={() => (
        <FileUploadButton
          label={uploadButtonLabel}
          accept={imagesOnly ? 'image/*' : '*/*'}
          onChange={onUpload}
          disabled={!uploadEnabled}
        />
      )}
    />
  );
}

MediaToolbar.propTypes = {
  t: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  privateUpload: PropTypes.bool,
  forImage: PropTypes.bool,
  onDownload: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  query: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  onSearchKeyDown: PropTypes.func.isRequired,
  searchDisabled: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  canInsert: PropTypes.bool,
  onInsert: PropTypes.func.isRequired,
  hasSelection: PropTypes.bool.isRequired,
  isPersisting: PropTypes.bool,
  isDeleting: PropTypes.bool,
  selectedFile: PropTypes.oneOfType([
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      draft: PropTypes.bool.isRequired,
      name: PropTypes.string.isRequired,
    }),
    PropTypes.shape({}),
  ]),
};

export default MediaToolbar;
