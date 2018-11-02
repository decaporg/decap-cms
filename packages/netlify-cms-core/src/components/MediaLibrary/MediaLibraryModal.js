import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { isEmpty } from 'lodash';
import { translate } from 'react-polyglot';
import { Modal } from 'UI';
import MediaLibrarySearch from './MediaLibrarySearch';
import MediaLibraryHeader from './MediaLibraryHeader';
import MediaLibraryActions from './MediaLibraryActions';
import MediaLibraryCardGrid from './MediaLibraryCardGrid';
import EmptyMessage from './EmptyMessage';
import { colors } from 'netlify-cms-ui-default';

/**
 * Responsive styling needs to be overhauled. Current setup requires specifying
 * widths per breakpoint.
 */
const cardWidth = `280px`;
const cardMargin = `10px`;

/**
 * cardWidth + cardMargin * 2 = cardOutsideWidth
 * (not using calc because this will be nested in other calcs)
 */
const cardOutsideWidth = `300px`;

const LibraryTop = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
`;

const StyledModal = styled(Modal)`
  display: grid;
  grid-template-rows: 120px auto;
  width: calc(${cardOutsideWidth} + 20px);
  background-color: ${props => props.isPrivate && colors.grayDark};

  @media (min-width: 800px) {
    width: calc(${cardOutsideWidth} * 2 + 20px);
  }

  @media (min-width: 1120px) {
    width: calc(${cardOutsideWidth} * 3 + 20px);
  }

  @media (min-width: 1440px) {
    width: calc(${cardOutsideWidth} * 4 + 20px);
  }

  @media (min-width: 1760px) {
    width: calc(${cardOutsideWidth} * 5 + 20px);
  }

  @media (min-width: 2080px) {
    width: calc(${cardOutsideWidth} * 6 + 20px);
  }

  h1 {
    color: ${props => props.isPrivate && colors.textFieldBorder};
  }

  button:disabled,
  label[disabled] {
    background-color: ${props => props.isPrivate && `rgba(217, 217, 217, 0.15)`};
  }
`;

const MediaLibraryModal = ({
  isVisible,
  canInsert,
  files,
  dynamicSearch,
  dynamicSearchActive,
  forImage,
  isLoading,
  isPersisting,
  isDeleting,
  hasNextPage,
  isPaginating,
  privateUpload,
  query,
  selectedFile,
  handleFilter,
  handleQuery,
  toTableData,
  handleClose,
  handleSearchChange,
  handleSearchKeyDown,
  handlePersist,
  handleDelete,
  handleInsert,
  setScrollContainerRef,
  handleAssetClick,
  handleLoadMore,
  getDisplayURL,
  t,
}) => {
  const filteredFiles = forImage ? handleFilter(files) : files;
  const queriedFiles = !dynamicSearch && query ? handleQuery(query, filteredFiles) : filteredFiles;
  const tableData = toTableData(queriedFiles);
  const hasFiles = files && !!files.length;
  const hasFilteredFiles = filteredFiles && !!filteredFiles.length;
  const hasSearchResults = queriedFiles && !!queriedFiles.length;
  const hasMedia = hasSearchResults;
  const shouldShowEmptyMessage = !hasMedia;
  const emptyMessage =
    (isLoading && !hasMedia && t('mediaLibrary.mediaLibraryModal.loading')) ||
    (dynamicSearchActive && t('mediaLibrary.mediaLibraryModal.noResults')) ||
    (!hasFiles && t('mediaLibrary.mediaLibraryModal.noAssetsFound')) ||
    (!hasFilteredFiles && t('mediaLibrary.mediaLibraryModal.noImagesFound')) ||
    (!hasSearchResults && t('mediaLibrary.mediaLibraryModal.noResults'));
  const hasSelection = hasMedia && !isEmpty(selectedFile);
  const shouldShowButtonLoader = isPersisting || isDeleting;

  return (
    <StyledModal isOpen={isVisible} onClose={handleClose} isPrivate={privateUpload}>
      <LibraryTop>
        <div>
          <MediaLibraryHeader
            onClose={handleClose}
            title={`${privateUpload ? t('mediaLibrary.mediaLibraryModal.private') : ''}${
              forImage
                ? t('mediaLibrary.mediaLibraryModal.images')
                : t('mediaLibrary.mediaLibraryModal.mediaAssets')
            }`}
            isPrivate={privateUpload}
          />
          <MediaLibrarySearch
            value={query}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('mediaLibrary.mediaLibraryModal.search')}
            disabled={!dynamicSearchActive && !hasFilteredFiles}
          />
        </div>
        <MediaLibraryActions
          uploadButtonLabel={
            isPersisting
              ? t('mediaLibrary.mediaLibraryModal.uploading')
              : t('mediaLibrary.mediaLibraryModal.uploadNew')
          }
          deleteButtonLabel={
            isDeleting
              ? t('mediaLibrary.mediaLibraryModal.deleting')
              : t('mediaLibrary.mediaLibraryModal.deleteSelected')
          }
          insertButtonLabel={t('mediaLibrary.mediaLibraryModal.chooseSelected')}
          uploadEnabled={!shouldShowButtonLoader}
          deleteEnabled={!shouldShowButtonLoader && hasSelection}
          insertEnabled={hasSelection}
          insertVisible={canInsert}
          imagesOnly={forImage}
          onPersist={handlePersist}
          onDelete={handleDelete}
          onInsert={handleInsert}
        />
      </LibraryTop>
      {!shouldShowEmptyMessage ? null : (
        <EmptyMessage content={emptyMessage} isPrivate={privateUpload} />
      )}
      <MediaLibraryCardGrid
        setScrollContainerRef={setScrollContainerRef}
        mediaItems={tableData}
        isSelectedFile={file => selectedFile.key === file.key}
        onAssetClick={handleAssetClick}
        canLoadMore={hasNextPage}
        onLoadMore={handleLoadMore}
        isPaginating={isPaginating}
        paginatingMessage={t('mediaLibrary.mediaLibraryModal.loading')}
        cardWidth={cardWidth}
        cardMargin={cardMargin}
        isPrivate={privateUpload}
        getDisplayURL={getDisplayURL}
      />
    </StyledModal>
  );
};

const fileShape = {
  key: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  queryOrder: PropTypes.number,
  url: PropTypes.string.isRequired,
  urlIsPublicPath: PropTypes.bool,
};

MediaLibraryModal.propTypes = {
  isVisible: PropTypes.bool,
  canInsert: PropTypes.bool,
  files: PropTypes.arrayOf(PropTypes.shape(fileShape)).isRequired,
  dynamicSearch: PropTypes.bool,
  dynamicSearchActive: PropTypes.bool,
  forImage: PropTypes.bool,
  isLoading: PropTypes.bool,
  isPersisting: PropTypes.bool,
  isDeleting: PropTypes.bool,
  hasNextPage: PropTypes.bool,
  isPaginating: PropTypes.bool,
  privateUpload: PropTypes.bool,
  query: PropTypes.string,
  selectedFile: PropTypes.oneOfType([PropTypes.shape(fileShape), PropTypes.shape({})]),
  handleFilter: PropTypes.func.isRequired,
  handleQuery: PropTypes.func.isRequired,
  toTableData: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleSearchChange: PropTypes.func.isRequired,
  handleSearchKeyDown: PropTypes.func.isRequired,
  handlePersist: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  handleInsert: PropTypes.func.isRequired,
  setScrollContainerRef: PropTypes.func.isRequired,
  handleAssetClick: PropTypes.func.isRequired,
  handleLoadMore: PropTypes.func.isRequired,
  getDisplayURL: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default translate()(MediaLibraryModal);
