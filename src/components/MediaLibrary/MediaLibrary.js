import React from 'react';
import { connect } from 'react-redux';
import { orderBy, get, last, isEmpty } from 'lodash';
import { Table, TableHead, TableRow, TableCell } from 'react-toolbox/lib/table';
import { Button, BrowseButton } from 'react-toolbox/lib/button';
import bytes from 'bytes';
import fuzzy from 'fuzzy';
import Dialog from '../UI/Dialog';
import { resolvePath } from '../../lib/pathHelper';
import { changeDraftField } from '../../actions/entries';
import { loadMedia, persistMedia, deleteMedia, insertMedia, closeMediaLibrary } from '../../actions/mediaLibrary';
import styles from './MediaLibrary.css';
import headCellTheme from './headCellTheme.css';

const MEDIA_LIBRARY_SORT_KEY = 'cms.medlib-sort';
const DEFAULT_SORT = [{ fieldName: 'name', direction: 'asc' }];
const IMAGE_EXTENSIONS = [ 'jpg', 'jpeg', 'webp', 'gif', 'png', 'bmp', 'svg', 'tiff' ];

class MediaLibrary extends React.Component {

  state = {
    selectedFile: {},
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
      this.setState({ selectedFile: {}, query: '' });
    }
  }

  filterImages = files => {
    return files ? files.filter(file => IMAGE_EXTENSIONS.includes(last(file.name.split('.')))) : [];
  };

  toTableData = files => {
    const tableData = files && files.map(({ id, name, size, queryOrder, url, urlIsPublicPath }) => {
      const ext = last(name.split('.'));
      return {
        id,
        name,
        type: ext.toUpperCase(),
        size,
        queryOrder,
        url,
        urlIsPublicPath,
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
    const selectedFile = this.state.selectedFile.id === row.id ? {} : row;
    this.setState({ selectedFile });
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
    const { dispatch, privateUpload } = this.props;
    const { files: fileList } = event.dataTransfer || event.target;
    const files = [...fileList];
    const file = files[0];
    return dispatch(persistMedia(file, privateUpload))
      .then(() => dispatch(loadMedia()));
  };

  handleInsert = () => {
    const { selectedFile } = this.state;
    const { name, url, urlIsPublicPath } = selectedFile;
    const { dispatch, config } = this.props;
    const publicPath = urlIsPublicPath ? url : resolvePath(name, config.get('public_folder'));
    dispatch(insertMedia(publicPath));
    this.handleClose();
  };

  handleDelete = () => {
    const { selectedFile } = this.state;
    const { files, dispatch } = this.props;
    if (!window.confirm('Are you sure you want to delete selected media?')) {
      return;
    }
    const file = files.find(file => selectedFile.id === file.id);
    dispatch(deleteMedia(file))
      .then(() => {
        this.setState({ selectedFile: {} });
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
    const { query, selectedFile } = this.state;
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
    const footer =
      <div>
        <Button label="Delete" onClick={this.handleDelete} className={styles.buttonLeft} disabled={isEmpty(selectedFile) || !hasMedia} accent raised />
        <BrowseButton label="Upload" accept={forImage ? 'image/*' : '*'} onChange={this.handlePersist} className={styles.buttonLeft} primary raised />
        <Button label="Close" onClick={this.handleClose} className={styles.buttonRight} raised/>
        {
          !canInsert ? null :
            <Button label="Insert" onClick={this.handleInsert} className={styles.buttonRight} disabled={isEmpty(selectedFile) || !hasMedia} primary raised />
        }
      </div>;

    return (
      <Dialog
        isVisible={isVisible}
        isLoading={shouldShowProgressBar}
        loadingMessage={loadingMessage}
        onClose={this.handleClose}
        footer={footer}
      >
        <h1>{forImage ? 'Images' : 'Assets'}</h1>
        <input className={styles.searchInput} type="text" value={this.state.query} onChange={this.handleSearch.bind(this)} placeholder="Search..." disabled={!hasFiles || !hasImages} autoFocus/>
        <div style={{ height: '100%', paddingBottom: '130px' }}>
          <div style={{ height: '100%', overflowY: 'auto' }} ref={ref => this.tableScrollRef = ref}>
            <Table onRowSelect={idx => this.handleRowSelect(tableData[idx])}>
              <TableHead>
                <TableCell theme={headCellTheme} style={{ width: '92px' }}>
                  Image
                </TableCell>
                <TableCell
                  theme={headCellTheme}
                  sorted={hasMedia ? this.getSortDirection('name') : null}
                  onClick={() => hasMedia && this.handleSortClick('name')}
                  style={{ cursor: hasMedia ? 'pointer' : 'auto' }}
                >
                  Name
                </TableCell>
                <TableCell
                  theme={headCellTheme}
                  sorted={hasMedia ? this.getSortDirection('type') : null}
                  onClick={() => hasMedia && this.handleSortClick('type')}
                  style={{ cursor: hasMedia ? 'pointer' : 'auto' }}
                >
                  Type
                </TableCell>
                <TableCell
                  theme={headCellTheme}
                  sorted={hasMedia ? this.getSortDirection('size') : null}
                  onClick={() => hasMedia && this.handleSortClick('size')}
                  style={{ cursor: hasMedia ? 'pointer' : 'auto' }}
                >
                  Size
                </TableCell>
              </TableHead>
              {
                tableData.map((file, idx) =>
                  <TableRow key={idx} selected={this.state.selectedFile.id === file.id } onFocus={this.handleRowFocus} onBlur={this.handleRowBlur}>
                    <TableCell>
                      {
                        !file.isImage ? null :
                          <a href={file.url} target="_blank" tabIndex="-1">
                            <img src={file.url} className={styles.thumbnail}/>
                          </a>
                      }
                    </TableCell>
                    <TableCell>{file.name}</TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>{bytes(file.size, { decimalPlaces: 0 })}</TableCell>
                  </TableRow>
                )
              }
            </Table>
            {hasMedia || shouldShowProgressBar ? null : <div style={{ height: '100%', width: '100%', position: 'absolute', top: '0', left: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h1>{emptyMessage}</h1></div>}
          </div>
        </div>
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
