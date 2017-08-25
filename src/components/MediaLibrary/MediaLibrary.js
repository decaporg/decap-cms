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
const defaultSort = [{ fieldName: 'name', direction: 'asc' }];

class MediaLibrary extends React.Component {

  state = {
    selectedFileName: '',
    query: '',
    sortFields: JSON.parse(localStorage.getItem(MEDIA_LIBRARY_SORT_KEY)) || defaultSort,
  };

  componentDidMount() {
    const { dispatch, closeMediaLibrary } = this.props;
    dispatch(loadMedia());
  }

  filterImages = files => {
    const imageExtensions = [ 'jpg', 'jpeg', 'webp', 'gif', 'png', 'bmp', 'svg', 'tiff' ];
    return files.filter(file => imageExtensions.includes(last(file.name.split('.'))));
  };

  toTableData = files => {
    const tableData = files && files.map(({ name, size, queryOrder }) => ({
      name,
      type: last(name.split('.')).toUpperCase(),
      size,
      queryOrder,
    }));
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
    const shouldShowProgressBar = isPersisting || isDeleting || isLoading;
    const loadingMessage = (isPersisting && 'Uploading...')
      || (isDeleting && 'Deleting...')
      || (isLoading && 'Loading...');

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
          <input className={styles.searchInput} type="text" value={this.state.query} onChange={this.handleSearch.bind(this)} placeholder="Search..." autoFocus/>
          <div style={{ height: '100%', paddingBottom: '130px' }}>
            <div style={{ height: '100%', overflowY: 'auto' }} ref={ref => this.tableScrollRef = ref}>
              <Table onRowSelect={idx => this.handleRowSelect(tableData[idx])}>
                <TableHead>
                  <TableCell
                    theme={headCellTheme}
                    sorted={this.getSortDirection('name')}
                    onClick={() => this.handleSortClick('name')}
                  >
                      Name
                  </TableCell>
                  <TableCell
                    theme={headCellTheme}
                    sorted={this.getSortDirection('type')}
                    onClick={() => this.handleSortClick('type')}
                  >
                      Type
                  </TableCell>
                  <TableCell
                    theme={headCellTheme}
                    sorted={this.getSortDirection('size')}
                    onClick={() => this.handleSortClick('size')}
                  >
                      Size
                  </TableCell>
                </TableHead>
                {
                  tableData.map((file, idx) =>
                    <TableRow key={idx} selected={this.state.selectedFileName === file.name } onFocus={this.handleRowFocus} onBlur={this.handleRowBlur}>
                      <TableCell>{file.name}</TableCell>
                      <TableCell>{file.type}</TableCell>
                      <TableCell>{bytes(file.size, { decimalPlaces: 0 })}</TableCell>
                    </TableRow>
                  )
                }
              </Table>
            </div>
          </div>
          <div className={styles.footer}>
            <Button label="Delete" onClick={this.handleDelete} className={styles.buttonLeft} accent raised />
            <BrowseButton label="Upload" accept={forImage ? 'image/*' : '*'} onChange={this.handlePersist} className={styles.buttonLeft} primary raised />
            <Button label="Close" onClick={this.handleClose} className={styles.buttonRight}/>
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
