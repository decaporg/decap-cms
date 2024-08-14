import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { AppBar } from 'decap-cms-ui-next';

import MediaSearchBar from './MediaSearchBar';
import MediaControls from './MediaControls';

const MediaToolbarWrap = styled(AppBar)`
  height: ${({ isDialog }) => (isDialog ? 'auto' : '80px')};
  padding: ${({ isDialog }) => (isDialog ? '0' : '2rem')};
  background-color: ${({ isDialog }) => (isDialog ? 'transparent' : '')};

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
  isDialog,
  onUpload,
  imagesOnly,
  query,
  onSearchChange,
  onSearchKeyDown,
  searchDisabled,
  uploadEnabled,
  uploadButtonLabel,
  onSelect,
  hasSelection,
  selectedButtonLabel,
  onDelete,
  deleteEnabled,
  deleteButtonLabel,
}) {
  return (
    <MediaToolbarWrap
      isDialog={isDialog}
      renderEnd={() => (
        <>
          <MediaSearchBar
            value={query}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
            placeholder={`${t('app.header.searchIn')} ${t(
              'mediaLibrary.mediaLibraryModal.mediaAssets',
            )}`}
            disabled={searchDisabled}
          />

          <MediaControls
            isDialog={isDialog}
            onSelect={onSelect}
            hasSelection={hasSelection}
            selectedButtonLabel={selectedButtonLabel}
            onDelete={onDelete}
            deleteEnabled={deleteEnabled}
            deleteButtonLabel={deleteButtonLabel}
            onUpload={onUpload}
            uploadEnabled={uploadEnabled}
            uploadButtonLabel={uploadButtonLabel}
            imagesOnly={imagesOnly}
          />
        </>
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
