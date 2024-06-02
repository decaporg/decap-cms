import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { orderBy, map } from 'lodash';
import { translate } from 'react-polyglot';
import fuzzy from 'fuzzy';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import isEmpty from 'lodash/isEmpty';
import { fileExtension } from 'decap-cms-lib-util';

import {
  loadMedia as loadMediaAction,
  persistMedia as persistMediaAction,
  deleteMedia as deleteMediaAction,
  insertMedia as insertMediaAction,
  loadMediaDisplayURL as loadMediaDisplayURLAction,
  closeMediaLibrary as closeMediaLibraryAction,
} from '../../actions/mediaLibrary';
import { selectMediaFiles } from '../../reducers/mediaLibrary';
import MediaTitlebar from './Common/MediaTitlebar';
import EmptyMessage from './Common/EmptyMessage';
import MediaToolbar from './Common/MediaToolbar';
import MediaGallery from './Common/MediaGallery';
import MediaLibraryCardGrid from './MediaLibraryCardGrid';
import MediaSidebar from './Common/MediaSidebar';

/**
 * Extensions used to determine which files to show when the media library is
 * accessed from an image insertion field.
 */
const IMAGE_EXTENSIONS_VIEWABLE = [
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'png',
  'bmp',
  'tiff',
  'svg',
  'avif',
];
const IMAGE_EXTENSIONS = [...IMAGE_EXTENSIONS_VIEWABLE];

const MediaContainer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
`;

const MediaBody = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
  height: 100%;

  padding: ${({ isDialog }) => (isDialog ? '1rem' : '0 2rem')};
`;

const MediaHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

function MediaLibrary({
  isVisible,
  loadMediaDisplayURL,
  displayURLs,
  canInsert,
  isDialog,
  files = [],
  field,
  dynamicSearch,
  dynamicSearchActive,
  forImage,
  isLoading,
  isPersisting,
  isDeleting,
  hasNextPage,
  isPaginating,
  privateUpload,
  config,
  loadMedia,
  dynamicSearchQuery,
  page,
  persistMedia,
  deleteMedia,
  insertMedia,
  closeMediaLibrary,
  t,
}) {
  /**
   * The currently selected file and query are tracked in component state as
   * they do not impact the rest of the application.
   */
  const [selectedFile, setSelectedFile] = useState({});
  const [query, setQuery] = useState('');
  const [isPersisted, setIsPersisted] = useState(false);
  const [prevIsVisible, setPrevIsVisible] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    if (isPersisted) {
      setSelectedFile(files[0]);
      setIsPersisted(false);
    }
  }, [isPersisted]);

  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   /**
  //    * We clear old state from the media library when it's being re-opened
  //    * because, when doing so on close, the state is cleared while the media
  //    * library is still fading away.
  //    */
  //   const isOpening = !this.props.isVisible && nextProps.isVisible;
  //   if (isOpening) {
  //     this.setState({ selectedFile: {}, query: '' });
  //   }

  //   if (this.state.isPersisted) {
  //     this.setState({
  //       selectedFile: nextProps.files[0],
  //       isPersisted: false,
  //     });
  //   }
  // }

  // componentDidUpdate(prevProps) {
  //   const isOpening = !prevProps.isVisible && this.props.isVisible;

  //   if (isOpening && prevProps.privateUpload !== this.props.privateUpload) {
  //     this.props.loadMedia({ privateUpload: this.props.privateUpload });
  //   }

  //   if (this.state.isPersisted) {
  //     this.setState({
  //       selectedFile: this.props.files[0],
  //       isPersisted: false,
  //     });
  //   }
  // }

  // useEffect(() => {
  //   if (isPersisted) {
  //     setSelectedFile(files[0]);
  //     setIsPersisted(false);
  //   }
  // }, [isPersisted]);

  function loadDisplayURL(file) {
    loadMediaDisplayURL(file);
  }

  /**
   * Filter an array of file data to include only images.
   */
  function filterImages(files) {
    return files.filter(file => {
      const ext = fileExtension(file.name).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });
  }

  /**
   * Transform file data for table display.
   */
  function toTableData(files) {
    const tableData =
      files &&
      files.map(({ key, name, id, size, path, queryOrder, displayURL, draft }) => {
        const ext = fileExtension(name).toLowerCase();
        return {
          key,
          id,
          name,
          path,
          type: ext.toUpperCase(),
          size,
          queryOrder,
          displayURL,
          draft,
          isImage: IMAGE_EXTENSIONS.includes(ext),
          isViewableImage: IMAGE_EXTENSIONS_VIEWABLE.includes(ext),
        };
      });

    /**
     * Get the sort order for use with `lodash.orderBy`, and always add the
     * `queryOrder` sort as the lowest priority sort order.
     */
    // TODO Sorting?
    // const { sortFields } = this.state;
    // const fieldNames = map(sortFields, 'fieldName').concat('queryOrder');
    // const directions = map(sortFields, 'direction').concat('asc');
    // return orderBy(tableData, fieldNames, directions);
    return tableData;
  }

  function handleClose() {
    closeMediaLibrary();
  }

  /**
   * Toggle asset selection on click.
   */
  function handleAssetClick(asset) {
    setSelectedFile(selectedFile.key === asset.key ? {} : asset);
  }

  /**
   * Upload a file.
   */
  async function handlePersist(event) {
    /**
     * Stop the browser from automatically handling the file input click, and
     * get the file for upload, and retain the synthetic event for access after
     * the asynchronous persist operation.
     */
    event.persist();
    event.stopPropagation();
    event.preventDefault();
    const { files: fileList } = event.dataTransfer || event.target;
    const files = [...fileList];
    const file = files[0];
    const maxFileSize = config.max_file_size;

    if (maxFileSize && file.size > maxFileSize) {
      window.alert(
        t('mediaLibrary.mediaLibrary.fileTooLarge', {
          size: Math.floor(maxFileSize / 1000),
        }),
      );
    } else {
      await persistMedia(file, { privateUpload, field });

      setIsPersisted(true);

      scrollToTop();
    }

    event.target.value = null;
  }

  /**
   * Stores the public path of the file in the application store, where the
   * editor field that launched the media library can retrieve it.
   */
  function handleInsert() {
    const { path } = selectedFile;
    insertMedia(path, field);
    handleClose();
  }

  /**
   * Removes the selected file from the backend.
   */
  function handleDelete() {
    if (!window.confirm(t('mediaLibrary.mediaLibrary.onDelete'))) {
      return;
    }
    const file = files.find(file => selectedFile.key === file.key);
    deleteMedia(file, { privateUpload }).then(() => {
      setSelectedFile({});
    });
  }

  /**
   * Downloads the selected file.
   */
  function handleDownload() {
    const url = displayURLs.getIn([selectedFile.id, 'url']) || selectedFile.url;
    if (!url) {
      return;
    }

    const filename = selectedFile.name;

    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    setSelectedFile({});
  }

  function handleLoadMore() {
    const { loadMedia, dynamicSearchQuery, page, privateUpload } = this.props;
    loadMedia({ query: dynamicSearchQuery, page: page + 1, privateUpload });
  }

  /**
   * Executes media library search for implementations that support dynamic
   * search via request. For these implementations, the Enter key must be
   * pressed to execute search. If assets are being stored directly through
   * the GitHub backend, search is in-memory and occurs as the query is typed,
   * so this handler has no impact.
   */
  async function handleSearchKeyDown(event) {
    const { dynamicSearch, loadMedia, privateUpload } = this.props;
    if (event.key === 'Enter' && dynamicSearch) {
      await loadMedia({ query: this.state.query, privateUpload });
      this.scrollToTop();
    }
  }

  const scrollContainerRef = useRef(null);
  function scrollToTop() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }

  /**
   * Updates query state as the user types in the search field.
   */
  function handleSearchChange(event) {
    setQuery(event.target.value);
  }

  /**
   * Filters files that do not match the query. Not used for dynamic search.
   */
  function queryFilter(query, files) {
    /**
     * Because file names don't have spaces, typing a space eliminates all
     * potential matches, so we strip them all out internally before running the
     * query.
     */
    const strippedQuery = query.replace(/ /g, '');
    const matches = fuzzy.filter(strippedQuery, files, { extract: file => file.name });
    const matchFiles = matches.map((match, queryIndex) => {
      const file = files[match.index];
      return { ...file, queryIndex };
    });
    return matchFiles;
  }

  const filteredFiles = forImage ? filterImages(files) : files;
  const queriedFiles = !dynamicSearch && query ? queryFilter(query, filteredFiles) : filteredFiles;
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
  const uploadEnabled = !shouldShowButtonLoader;
  const deleteEnabled = !shouldShowButtonLoader && hasSelection;

  const uploadButtonLabel = isPersisting
    ? t('mediaLibrary.mediaLibraryModal.uploading')
    : t('mediaLibrary.mediaLibraryModal.upload');
  const deleteButtonLabel = isDeleting
    ? t('mediaLibrary.mediaLibraryModal.deleting')
    : t('mediaLibrary.mediaLibraryModal.deleteSelected');
  const downloadButtonLabel = t('mediaLibrary.mediaLibraryModal.download');

  return (
    <MediaContainer>
      {/* <MediaSidebar
        t={t}
        onUpload={handlePersist}
        imagesOnly={forImage}
        isPersisting={isPersisting}
      /> */}

      {!isDialog && (
        <MediaToolbar
          t={t}
          isDialog={isDialog}
          onUpload={handlePersist}
          imagesOnly={forImage}
          isPersisting={isPersisting}
          query={query}
          onSearchChange={handleSearchChange}
          onSearchKeyDown={handleSearchKeyDown}
          searchDisabled={!dynamicSearchActive && !hasFilteredFiles}
          uploadEnabled={uploadEnabled}
          uploadButtonLabel={uploadButtonLabel}
          onSelect={handleInsert}
          hasSelection={hasSelection}
          selectedButtonLabel={t('mediaLibrary.mediaLibraryModal.chooseSelected')}
          onDelete={handleDelete}
          deleteEnabled={deleteEnabled}
          deleteButtonLabel={deleteButtonLabel}
        />
      )}

      <MediaBody isDialog={isDialog}>
        <MediaHeader>
          <MediaTitlebar
            onClose={handleClose}
            title={`${privateUpload ? t('mediaLibrary.mediaLibraryModal.private') : ''}${
              forImage
                ? t('mediaLibrary.mediaLibraryModal.images')
                : t('mediaLibrary.mediaLibraryModal.mediaAssets')
            }`}
            isPrivate={privateUpload}
            isDialog={isDialog}
          />

          {isDialog && (
            <MediaToolbar
              t={t}
              isDialog={isDialog}
              onUpload={handlePersist}
              imagesOnly={forImage}
              isPersisting={isPersisting}
              query={query}
              onSearchChange={handleSearchChange}
              onSearchKeyDown={handleSearchKeyDown}
              searchDisabled={!dynamicSearchActive && !hasFilteredFiles}
              uploadEnabled={uploadEnabled}
              uploadButtonLabel={uploadButtonLabel}
              onSelect={handleInsert}
              hasSelection={hasSelection}
              selectedButtonLabel={t('mediaLibrary.mediaLibraryModal.chooseSelected')}
              onDelete={handleDelete}
              deleteEnabled={deleteEnabled}
              deleteButtonLabel={deleteButtonLabel}
            />
          )}
        </MediaHeader>

        {!shouldShowEmptyMessage ? null : (
          <EmptyMessage content={emptyMessage} isPrivate={privateUpload} />
        )}

        <MediaGallery
          mediaItems={tableData}
          selectable={isDialog}
          isSelectedFile={file => selectedFile.key === file.key}
          loadDisplayURL={loadDisplayURL}
          onAssetClick={handleAssetClick}
          draftText={t('mediaLibrary.mediaLibraryCard.draft')}
        />

        {/* <MediaLibraryCardGrid
          canLoadMore={hasNextPage}
          onLoadMore={handleLoadMore}
          isPaginating={isPaginating}
          paginatingMessage={t('mediaLibrary.mediaLibraryModal.loading')}
          cardDraftText={t('mediaLibrary.mediaLibraryCard.draft')}
          isPrivate={privateUpload}
          displayURLs={displayURLs}
        /> */}
      </MediaBody>
    </MediaContainer>
  );
}

export const fileShape = {
  displayURL: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  id: PropTypes.string.isRequired,
  key: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  queryOrder: PropTypes.number,
  size: PropTypes.number,
  path: PropTypes.string.isRequired,
};

MediaLibrary.propTypes = {
  isVisible: PropTypes.bool,
  loadMediaDisplayURL: PropTypes.func,
  displayURLs: ImmutablePropTypes.map,
  canInsert: PropTypes.bool,
  isDialog: PropTypes.bool,
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
  config: ImmutablePropTypes.map,
  loadMedia: PropTypes.func.isRequired,
  dynamicSearchQuery: PropTypes.string,
  page: PropTypes.number,
  persistMedia: PropTypes.func.isRequired,
  deleteMedia: PropTypes.func.isRequired,
  insertMedia: PropTypes.func.isRequired,
  closeMediaLibrary: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { mediaLibrary } = state;
  const field = mediaLibrary.get('field');

  const mediaLibraryProps = {
    isVisible: mediaLibrary.get('isVisible'),
    canInsert: mediaLibrary.get('canInsert'),
    files: selectMediaFiles(state, field),
    displayURLs: mediaLibrary.get('displayURLs'),
    dynamicSearch: mediaLibrary.get('dynamicSearch'),
    dynamicSearchActive: mediaLibrary.get('dynamicSearchActive'),
    dynamicSearchQuery: mediaLibrary.get('dynamicSearchQuery'),
    forImage: mediaLibrary.get('forImage'),
    isLoading: mediaLibrary.get('isLoading'),
    isPersisting: mediaLibrary.get('isPersisting'),
    isDeleting: mediaLibrary.get('isDeleting'),
    privateUpload: mediaLibrary.get('privateUpload'),
    config: mediaLibrary.get('config'),
    page: mediaLibrary.get('page'),
    hasNextPage: mediaLibrary.get('hasNextPage'),
    isPaginating: mediaLibrary.get('isPaginating'),
    field,
  };
  return { ...mediaLibraryProps };
}

const mapDispatchToProps = {
  loadMedia: loadMediaAction,
  persistMedia: persistMediaAction,
  deleteMedia: deleteMediaAction,
  insertMedia: insertMediaAction,
  loadMediaDisplayURL: loadMediaDisplayURLAction,
  closeMediaLibrary: closeMediaLibraryAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(MediaLibrary));
