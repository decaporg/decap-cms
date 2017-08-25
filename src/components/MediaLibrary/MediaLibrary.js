import React from 'react';
import { connect } from 'react-redux';
import { orderBy, get, last } from 'lodash';
import Dialog from 'react-toolbox/lib/dialog';
import { Table, TableHead, TableRow, TableCell } from 'react-toolbox/lib/table';
import { Button, BrowseButton } from 'react-toolbox/lib/button';
import Overlay from 'react-toolbox/lib/overlay';
import ProgressBar from 'react-toolbox/lib/progress_bar';
import FocusTrap from 'focus-trap-react';
import bytes from 'bytes';
import fuzzy from 'fuzzy';
import { resolvePath } from '../../lib/pathHelper';
import { createAssetProxy } from '../../valueObjects/AssetProxy';
import { changeDraftField } from '../../actions/entries';
import { addAsset } from '../../actions/media';
import { loadMedia, persistMedia, deleteMedia, insertMedia, closeMediaLibrary } from '../../actions/mediaLibrary';
import styles from './MediaLibrary.css';
import dialogTheme from './dialogTheme.css';
import headCellTheme from './headCellTheme.css';
import progressBarTheme from './progressBarTheme.css';
import progressOverlayTheme from './progressOverlayTheme.css';

const MEDIA_LIBRARY_SORT_KEY = 'cms.medlib-sort';
const DEFAULT_SORT = [{ fieldName: 'name', direction: 'asc' }];
const IMAGE_EXTENSIONS = [ 'jpg', 'jpeg', 'webp', 'gif', 'png', 'bmp', 'svg', 'tiff' ];

class MediaLibrary extends React.Component {

  state = {
    selectedFileName: '',
    query: '',
    sortFields: JSON.parse(localStorage.getItem(MEDIA_LIBRARY_SORT_KEY)) || DEFAULT_SORT,
  };

  componentDidMount() {
    const { dispatch, closeMediaLibrary } = this.props;
    dispatch(loadMedia());
  }

  componentWillReceiveProps(nextProps) {
    const isOpening = !this.props.isVisible && nextProps.isVisible;
    if (isOpening) {
      this.setState({ selectedFileName: '', query: '' });
    }
  }

  filterImages = files => {
    return files ? files.filter(file => IMAGE_EXTENSIONS.includes(last(file.name.split('.')))) : [];
  };

  toTableData = files => {
    const tableData = files && files.map(({ name, size, queryOrder, download_url }) => {
      const ext = last(name.split('.'));
      return {
        name,
        type: ext.toUpperCase(),
        size,
        queryOrder,
        url: download_url,
        isImage: IMAGE_EXTENSIONS.includes(ext),
      };
    });
    const sort = this.getSort(this.state.sortFields);
    return orderBy(tableData, ...sort);
  };

  getSort = sortFields => {
    const sort = sortFields.reduce((acc, { fieldName, direction }) => {
      acc[0].push(fieldName);
      acc[1].push(direction);
      return acc;
    }, [[], []]);

    /**
     * The `queryOrder` field set on the file during media library search is
     * always the lowest priority order. Has no effect if no query has been
     * entered.
     */
    sort[0].push('queryOrder');
    sort[1].push('asc');

    return sort;
  };

  handleClose = () => {
    this.props.dispatch(closeMediaLibrary());
  };

  handleRowSelect = row => {
    const selectedFileName = this.state.selectedFileName === row.name ? null : row.name;
    this.setState({ selectedFileName });
  };

  handleSortClick = fieldName => {
    const { sortFields } = this.state;
    const currentSort = sortFields.find(sort => sort.fieldName === fieldName) || {};
    const { direction } = currentSort;
    const shouldSort = !direction || direction === 'asc';
    const newSortField = shouldSort && { fieldName, direction: !direction ? 'asc' : 'desc' };
    const remainingSorts = sortFields.filter(sort => sort.fieldName !== fieldName);
    const newSort = shouldSort ? [newSortField, ...remainingSorts] : remainingSorts;
    localStorage.setItem(MEDIA_LIBRARY_SORT_KEY, JSON.stringify(newSort));
    this.setState({ sortFields: newSort });
  }

  getSortDirection = fieldName => {
    const { sortFields } = this.state;
    const sort = sortFields.find(sort => sort.fieldName === fieldName);
    const direction = get(sort, 'direction');
    if (direction === 'asc') return 'desc';
    if (direction === 'desc') return 'asc';
  };

  handlePersist = event => {
    event.stopPropagation();
    event.preventDefault();
    const { dispatch } = this.props;
    const { files: fileList } = event.dataTransfer || event.target;
    const files = [...fileList];
    const file = files[0];
    return createAssetProxy(file.name, file)
      .then(assetProxy => {
        dispatch(addAsset(assetProxy));
        return dispatch(persistMedia([assetProxy]));
      })
      .then(() => dispatch(loadMedia()));
  };

  handleInsert = () => {
    const { selectedFileName } = this.state;
    const { dispatch, config } = this.props;
    const publicPath = resolvePath(selectedFileName, config.get('public_folder'));
    dispatch(insertMedia(publicPath));
    this.handleClose();
  };

  handleDelete = () => {
    const { selectedFileName } = this.state;
    const { files, dispatch } = this.props;
    if (!window.confirm('Are you sure you want to delete selected media?')) {
      return;
    }
    const fileToDelete = files.find(file => file.name === selectedFileName);
    dispatch(deleteMedia(fileToDelete))
      .then(() => {
        this.setState({ selectedFileName: '' });
      });
  };

  handleSearch = event => {
    this.setState({ query: event.target.value });
  };

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

  handleRowFocus = event => {
    const scrollContainer = this.tableScrollRef.parentElement;
    const scrollContainerInnerHeight = scrollContainer.clientHeight;
    const scrollContainerBottomPadding = 130;
    const scrollElement = this.tableScrollRef;
    const scrollPosition = scrollElement.scrollTop;
    const row = event.currentTarget;
    const rowHeight = row.offsetHeight;
    const rowPosition = row.offsetTop;

    event.currentTarget.classList.add('mediaLibraryRowFocused');

    const rowAboveVisibleArea = scrollPosition > rowPosition;

    if (rowAboveVisibleArea) {
      scrollElement.scrollTop = rowPosition;
      return;
    }

    const effectiveScrollPosition = scrollContainerInnerHeight + scrollPosition;
    const effectiveRowPosition = rowPosition + rowHeight + scrollContainerBottomPadding;
    const rowBelowVisibleArea = effectiveScrollPosition < effectiveRowPosition;

    if (rowBelowVisibleArea) {
      const scrollTopOffset = scrollContainerInnerHeight - scrollContainerBottomPadding - rowHeight;
      scrollElement.scrollTop = rowPosition - scrollTopOffset;
    }
  };

  handleRowBlur = event => {
    event.currentTarget.classList.remove('mediaLibraryRowFocused');
  };

  render() {
    const { isVisible, canInsert, files, forImage, isLoading, isPersisting, isDeleting } = this.props;
    const { query } = this.state;
    const filteredFiles = forImage ? this.filterImages(files) : files;
    const queriedFiles = query ? this.queryFilter(query, filteredFiles) : filteredFiles;
    const tableData = this.toTableData(queriedFiles);
    const hasFiles = files && !!files.length;
    const hasImages = filteredFiles && !!filteredFiles.length;
    const hasSearchResults = queriedFiles && !!queriedFiles.length;
    const hasMedia = hasSearchResults;
    const shouldShowProgressBar = isPersisting || isDeleting || isLoading;
    const loadingMessage = (isPersisting && 'Uploading...')
      || (isDeleting && 'Deleting...')
      || (isLoading && 'Loading...');
    const emptyMessage = (!hasFiles && 'No files found.')
      || (!hasImages && 'No images found.')
      || (!hasSearchResults && 'No results.');

    return (
      <Dialog
        type="large"
        active={isVisible}
        onEscKeyDown={this.handleClose}
        onOverlayClick={this.handleClose}
        theme={dialogTheme}
        className={styles.dialog}
      >
        <Overlay active={shouldShowProgressBar} theme={progressOverlayTheme}>
          <FocusTrap
            paused={!isVisible || !shouldShowProgressBar}
            focusTrapOptions={{ clickOutsideDeactivates: true, initialFocus: 'h1' }}
            className={styles.progressBarContainer}
          >
            <h1 style={{ marginTop: '-40px' }} tabIndex="-1">{ loadingMessage }</h1>
            <ProgressBar type="linear" mode="indeterminate" theme={progressBarTheme}/>
          </FocusTrap>
        </Overlay>
        <FocusTrap
          paused={!isVisible || shouldShowProgressBar}
          focusTrapOptions={{ clickOutsideDeactivates: true }}
          className={styles.tableContainer}
        >
          <h1>{forImage ? 'Images' : 'Assets'}</h1>
          <input className={styles.searchInput} type="text" value={this.state.query} onChange={this.handleSearch.bind(this)} placeholder="Search..." disabled={!hasFiles || !hasImages} autoFocus/>
          <div style={{ height: '100%', paddingBottom: '130px' }}>
            <div style={{ height: '100%', overflowY: 'auto' }} ref={ref => this.tableScrollRef = ref}>
              <Table onRowSelect={idx => this.handleRowSelect(tableData[idx])}>
                <TableHead>
                  <TableCell
                    theme={headCellTheme}
                    sorted={hasMedia && this.getSortDirection('name')}
                    onClick={() => hasMedia && this.handleSortClick('name')}
                    style={{ cursor: hasMedia ? 'pointer' : 'auto' }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    theme={headCellTheme}
                    sorted={hasMedia && this.getSortDirection('type')}
                    onClick={() => hasMedia && this.handleSortClick('type')}
                    style={{ cursor: hasMedia ? 'pointer' : 'auto' }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    theme={headCellTheme}
                    sorted={hasMedia && this.getSortDirection('size')}
                    onClick={() => hasMedia && this.handleSortClick('size')}
                    style={{ cursor: hasMedia ? 'pointer' : 'auto' }}
                  >
                    Size
                  </TableCell>
                  <TableCell theme={headCellTheme}>
                    Image
                  </TableCell>
                </TableHead>
                {
                  tableData.map((file, idx) =>
                    <TableRow key={idx} selected={this.state.selectedFileName === file.name } onFocus={this.handleRowFocus} onBlur={this.handleRowBlur}>
                      <TableCell>{file.name}</TableCell>
                      <TableCell>{file.type}</TableCell>
                      <TableCell>{bytes(file.size, { decimalPlaces: 0 })}</TableCell>
                      <TableCell>
                        {file.isImage ? <img src={file.url} className={styles.thumbnail}/> : null}
                      </TableCell>
                    </TableRow>
                  )
                }
              </Table>
              {hasMedia || shouldShowProgressBar ? null : <div style={{ height: '100%', width: '100%', position: 'absolute', top: '0', left: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h1>{emptyMessage}</h1></div>}
            </div>
          </div>
          <div className={styles.footer}>
            <Button label="Delete" onClick={this.handleDelete} className={styles.buttonLeft} accent raised />
            <BrowseButton label="Upload" accept={forImage ? 'image/*' : '*'} onChange={this.handlePersist} className={styles.buttonLeft} primary raised />
            <Button label="Close" onClick={this.handleClose} className={styles.buttonRight} raised/>
            {!canInsert ? null :
              <Button
                label="Insert"
                onClick={this.handleInsert}
                className={styles.buttonRight}
                primary
                raised
              />}
          </div>
        </FocusTrap>
      </Dialog>
    );
  }
}

export default connect(state => {
  return {
    config: state.config,
    ...state.mediaLibrary.toObject(),
  };
})(MediaLibrary);
