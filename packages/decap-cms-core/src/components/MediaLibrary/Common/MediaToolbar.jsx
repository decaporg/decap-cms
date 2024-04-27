import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import color from 'color';
import { ButtonGroup, IconButton } from 'decap-cms-ui-next';

import MediaSearchBar from './MediaSearchBar';

const MediaToolbarWrap = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1rem 1rem 1rem;
`;

const ViewStyleControls = styled(ButtonGroup)`
  ${({ theme }) => css`
    background-color: ${color(theme.color.neutral['700']).alpha(0.2).string()};
    border-radius: 8px;
    margin: initial;
  `}
`;

function MediaToolbar({
  t,
  onClose,
  privateUpload,
  forImage,
  onDownload,
  onUpload,
  query,
  onSearchChange,
  onSearchKeyDown,
  searchDisabled,
  onDelete,
  canInsert,
  onInsert,
  hasSelection,
  isPersisting,
  isDeleting,
  selectedFile,
}) {
  return (
    <MediaToolbarWrap>
      <MediaSearchBar
        value={query}
        onChange={onSearchChange}
        onKeyDown={onSearchKeyDown}
        placeholder={t('mediaLibrary.mediaLibraryModal.search')}
        disabled={searchDisabled}
      />

      <ViewStyleControls>
        <IconButton icon="bulleted-list" />
        <IconButton icon="grid" />
      </ViewStyleControls>
    </MediaToolbarWrap>
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
