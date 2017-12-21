import React from 'react';
import { connect } from 'react-redux';
import { orderBy, get, isEmpty, map } from 'lodash';
import c from 'classnames';
import fuzzy from 'fuzzy';
import Waypoint from 'react-waypoint';
import { Modal, FileUploadButton } from 'UI';
import { resolvePath, fileExtension } from 'Lib/pathHelper';
import { changeDraftField } from 'Actions/entries';
import {
  loadMedia as loadMediaAction,
  persistMedia as persistMediaAction,
  deleteMedia as deleteMediaAction,
  insertMedia as insertMediaAction,
  closeMediaLibrary as closeMediaLibraryAction,
} from 'Actions/mediaLibrary';
import { Icon } from 'UI';


/**
 * Extensions used to determine which files to show when the media library is
 * accessed from an image insertion field.
 */
const IMAGE_EXTENSIONS_VIEWABLE = [ 'jpg', 'jpeg', 'webp', 'gif', 'png', 'bmp', 'tiff', 'svg' ];
const IMAGE_EXTENSIONS = [ ...IMAGE_EXTENSIONS_VIEWABLE ];

class MediaLibrary extends React.Component {

  /**
   * The currently selected file and query are tracked in component state as
   * they do not impact the rest of the application.
   */
  state = {
    selectedFile: {},
    query: '',
  };

  componentDidMount() {
    this.props.loadMedia();
  }

  componentWillReceiveProps(nextProps) {
    /**
     * We clear old state from the media library when it's being re-opened
     * because, when doing so on close, the state is cleared while the media
     * library is still fading away.
     */
    const isOpening = !this.props.isVisible && nextProps.isVisible;
    if (isOpening) {
      this.setState({ selectedFile: {}, query: '' });
    }

    if (isOpening && (this.props.privateUpload !== nextProps.privateUpload)) {
      this.props.loadMedia({ privateUpload: nextProps.privateUpload });
    }
  }

  /**
   * Filter an array of file data to include only images.
   */
  filterImages = (files = []) => {
    return files.filter(file => {
      const ext = fileExtension(file.name).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });
  };

  /**
   * Transform file data for table display.
   */
  toTableData = files => {
    const tableData = files && files.map(({ key, name, size, queryOrder, url, urlIsPublicPath }) => {
      const ext = fileExtension(name).toLowerCase();
      return {
        key,
        name,
        type: ext.toUpperCase(),
        size,
        queryOrder,
        url,
        urlIsPublicPath,
        isImage: IMAGE_EXTENSIONS.includes(ext),
        isViewableImage: IMAGE_EXTENSIONS_VIEWABLE.includes(ext),
      };
    });

    /**
     * Get the sort order for use with `lodash.orderBy`, and always add the
     * `queryOrder` sort as the lowest priority sort order.
     */
    const { sortFields } = this.state;
    const fieldNames = map(sortFields, 'fieldName').concat('queryOrder');
    const directions = map(sortFields, 'direction').concat('asc');
    return orderBy(tableData, fieldNames, directions);
  };

  handleClose = () => {
    this.props.closeMediaLibrary();
  };

  /**
   * Toggle asset selection on click.
   */
  handleAssetClick = asset => {
    const selectedFile = this.state.selectedFile.key === asset.key ? {} : asset;
    this.setState({ selectedFile });
  };

  /**
   * Upload a file.
   */
  handlePersist = async event => {
    /**
     * Stop the browser from automatically handling the file input click, and
     * get the file for upload, and retain the synthetic event for access after
     * the asynchronous persist operation.
     */
    event.stopPropagation();
    event.preventDefault();
    event.persist();
    const { persistMedia, privateUpload } = this.props;
    const { files: fileList } = event.dataTransfer || event.target;
    const files = [...fileList];
    const file = files[0];

    await persistMedia(file, { privateUpload });

    event.target.value = null;

    this.scrollToTop();
  };

  /**
   * Stores the public path of the file in the application store, where the
   * editor field that launched the media library can retrieve it.
   */
  handleInsert = () => {
    const { selectedFile } = this.state;
    const { name, url, urlIsPublicPath } = selectedFile;
    const { insertMedia, publicFolder } = this.props;
    const publicPath = urlIsPublicPath ? url : resolvePath(name, publicFolder);
    insertMedia(publicPath);
    this.handleClose();
  };

  /**
   * Removes the selected file from the backend.
   */
  handleDelete = () => {
    const { selectedFile } = this.state;
    const { files, deleteMedia, privateUpload } = this.props;
    if (!window.confirm('Are you sure you want to delete selected media?')) {
      return;
    }
    const file = files.find(file => selectedFile.key === file.key);
    deleteMedia(file, { privateUpload })
      .then(() => {
        this.setState({ selectedFile: {} });
      });
  };

  handleLoadMore = () => {
    const { loadMedia, dynamicSearchQuery, page, privateUpload } = this.props;
    loadMedia({ query: dynamicSearchQuery, page: page + 1, privateUpload });
  };

  /**
   * Executes media library search for implementations that support dynamic
   * search via request. For these implementations, the Enter key must be
   * pressed to execute search. If assets are being stored directly through
   * the GitHub backend, search is in-memory and occurs as the query is typed,
   * so this handler has no impact.
   */
  handleSearchKeyDown = async (event) => {
    const { dynamicSearch, loadMedia, privateUpload } = this.props;
    if (event.key === 'Enter' && dynamicSearch) {
      await loadMedia({ query: this.state.query, privateUpload })
      this.scrollToTop();
    }
  };

  scrollToTop = () => {
    this.scrollContainerRef.scrollTop = 0;
  }

  /**
   * Updates query state as the user types in the search field.
   */
  handleSearchChange = event => {
    this.setState({ query: event.target.value });
  };

  /**
   * Filters files that do not match the query. Not used for dynamic search.
   */
  queryFilter = (query, files) => {
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
  };

  render() {
    const {
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
      page,
      isPaginating,
      privateUpload,
    } = this.props;
    const { query, selectedFile } = this.state;
    const filteredFiles = forImage ? this.filterImages(files) : files;
    const queriedFiles = (!dynamicSearch && query) ? this.queryFilter(query, filteredFiles) : filteredFiles;
    const tableData = this.toTableData(queriedFiles);
    const hasFiles = files && !!files.length;
    const hasFilteredFiles = filteredFiles && !!filteredFiles.length;
    const hasSearchResults = queriedFiles && !!queriedFiles.length;
    const hasMedia = hasSearchResults;
    const shouldShowEmptyMessage = !hasMedia;
    const emptyMessage = (isLoading && !hasMedia && 'Loading...')
      || (dynamicSearchActive && 'No results.')
      || (!hasFiles && 'No assets found.')
      || (!hasFilteredFiles && 'No images found.')
      || (!hasSearchResults && 'No results.');
    const hasSelection = hasMedia && !isEmpty(selectedFile);
    const shouldShowButtonLoader = isPersisting || isDeleting;

    return (
      <Modal
        isOpen={isVisible}
        onClose={this.handleClose}
        className={c('nc-mediaLibrary-dialog', { 'nc-mediaLibrary-dialogPrivate': privateUpload })}
      >
        <div className="nc-mediaLibrary-top">
          <div>
            <div className="nc-mediaLibrary-header">
              <button className="nc-mediaLibrary-close" onClick={this.handleClose}>
                <Icon type="close"/>
              </button>
              <h1 className="nc-mediaLibrary-title">
                {privateUpload ? 'Private ' : null}
                {forImage ? 'Images' : 'Media assets'}
              </h1>
            </div>
            <div className="nc-mediaLibrary-search">
              <Icon type="search" size="small"/>
              <input
                className=""
                value={query}
                onChange={this.handleSearchChange}
                onKeyDown={event => this.handleSearchKeyDown(event)}
                placeholder="Search..."
                disabled={!dynamicSearchActive && !hasFilteredFiles}
              />
            </div>
          </div>
          <div className="nc-mediaLibrary-actionContainer">
            <FileUploadButton
              className={`nc-mediaLibrary-uploadButton ${shouldShowButtonLoader ? 'nc-mediaLibrary-uploadButton-disabled' : ''}`}
              label={isPersisting ? 'Uploading...' : 'Upload new'}
              imagesOnly={forImage}
              onChange={this.handlePersist}
              disabled={shouldShowButtonLoader}
            />
            <div className="nc-mediaLibrary-lowerActionContainer">
              <button
                className="nc-mediaLibrary-deleteButton"
                onClick={this.handleDelete}
                disabled={shouldShowButtonLoader || !hasSelection}
              >
                {isDeleting ? 'Deleting...' : 'Delete selected'}
              </button>
              { !canInsert ? null :
                <button
                  onClick={this.handleInsert}
                  disabled={!hasSelection}
                  className="nc-mediaLibrary-insertButton"
                >
                  Choose selected
                </button>
              }
            </div>
          </div>
        </div>
        {
          shouldShowEmptyMessage
            ? <div className="nc-mediaLibrary-emptyMessage"><h1>{emptyMessage}</h1></div>
            : null
        }
        <div className="nc-mediaLibrary-cardGrid-container" ref={ref => (this.scrollContainerRef = ref)}>
          <div className="nc-mediaLibrary-cardGrid">
            {
              tableData.map((file, idx) =>
                <div
                  key={file.key}
                  className={c('nc-mediaLibrary-card', { 'nc-mediaLibrary-card-selected': selectedFile.key === file.key })}
                  onClick={() => this.handleAssetClick(file)}
                  tabIndex="-1"
                >
                  <div className="nc-mediaLibrary-cardImage-container">
                    {
                      file.isViewableImage
                        ? <img src={file.url} className="nc-mediaLibrary-cardImage"/>
                        : <div className="nc-mediaLibrary-cardImage"/>
                    }
                  </div>
                  <p className="nc-mediaLibrary-cardText">{file.name}</p>
                </div>
              )
            }
            {
              hasNextPage
                ? <Waypoint onEnter={() => this.handleLoadMore()}/>
                : null
            }
          </div>
          { isPaginating ? <h1 className="nc-mediaLibrary-paginatingMessage">Loading...</h1> : null }
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => {
  const { config, mediaLibrary } = state;
  const configProps = {
    publicFolder: config.get('public_folder'),
  };
  const mediaLibraryProps = {
    isVisible: mediaLibrary.get('isVisible'),
    canInsert: mediaLibrary.get('canInsert'),
    files: mediaLibrary.get('files'),
    dynamicSearch: mediaLibrary.get('dynamicSearch'),
    dynamicSearchActive: mediaLibrary.get('dynamicSearchActive'),
    dynamicSearchQuery: mediaLibrary.get('dynamicSearchQuery'),
    forImage: mediaLibrary.get('forImage'),
    isLoading: mediaLibrary.get('isLoading'),
    isPersisting: mediaLibrary.get('isPersisting'),
    isDeleting: mediaLibrary.get('isDeleting'),
    privateUpload: mediaLibrary.get('privateUpload'),
    page: mediaLibrary.get('page'),
    hasNextPage: mediaLibrary.get('hasNextPage'),
    isPaginating: mediaLibrary.get('isPaginating'),
  };
  return { ...configProps, ...mediaLibraryProps };
};

const mapDispatchToProps = {
  loadMedia: loadMediaAction,
  persistMedia: persistMediaAction,
  deleteMedia: deleteMediaAction,
  insertMedia: insertMediaAction,
  closeMediaLibrary: closeMediaLibraryAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(MediaLibrary);
