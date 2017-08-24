import React from 'react';
import { connect } from 'react-redux';
import { orderBy, get, last } from 'lodash';
import Dialog from 'react-toolbox/lib/dialog';
import { Table, TableHead, TableRow, TableCell } from 'react-toolbox/lib/table';
import { Button, BrowseButton } from 'react-toolbox/lib/button';
import bytes from 'bytes';
import { resolvePath } from '../../lib/pathHelper';
import { createAssetProxy } from '../../valueObjects/AssetProxy';
import { changeDraftField } from '../../actions/entries';
import { addAsset } from '../../actions/media';
import { loadMedia, persistMedia, deleteMedia, insertMedia, closeMediaLibrary } from '../../actions/mediaLibrary';
import styles from './MediaLibrary.css';
import dialogTheme from './dialogTheme.css';
import headCellTheme from './headCellTheme.css';

class MediaLibrary extends React.Component {

  state = {
    selectedFileName: '',
    sortFields: [{ fieldName: 'name', direction: 'asc' }],
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
    const tableData = files && files.map(file => ({
      name: file.name,
      type: last(file.name.split('.')).toUpperCase(),
      size: file.size
    }));
    const sort = this.state.sortFields.reduce((acc, { fieldName, direction }) => {
      acc[0].push(fieldName);
      acc[1].push(direction);
      return acc;
    }, [[], []]);
    return orderBy(tableData, ...sort);
  };

  handleClose = () => {
    this.props.dispatch(closeMediaLibrary());
    this.setState({ selectedFileName: '' });
  };

  handleRowSelect = row => {
    this.setState({ selectedFileName: row && row.name });
  };

  handleSortClick = fieldName => {
    const { sortFields } = this.state;
    const currentSort = sortFields.find(sort => sort.fieldName === fieldName);

    if (!currentSort) {
      const newSort = { fieldName, direction: 'asc' };
      const filteredSortFields = sortFields.filter(sort => sort.fieldName !== fieldName);
      const newSortFields = [newSort, ...filteredSortFields];
      this.setState({ sortFields: newSortFields });
    }

    else if (currentSort && currentSort.direction === 'asc') {
      const newSort = { fieldName, direction: 'desc' };
      const filteredSortFields = sortFields.filter(sort => sort.fieldName !== fieldName);
      const newSortFields = [newSort, ...filteredSortFields];
      this.setState({ sortFields: newSortFields });
    }

    else {
      const filteredSortFields = sortFields.filter(sort => sort.fieldName !== fieldName);
      this.setState({ sortFields: filteredSortFields });
    }
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
    return this.handleClose();
  };

  handleDelete = () => {
    const { selectedFileName } = this.state;
    const { files, dispatch } = this.props;
    if (!window.confirm('Are you sure you want to delete selected media?')) {
      return;
    }
    const fileToDelete = files.find(file => file.name === selectedFileName);
    return dispatch(deleteMedia([fileToDelete]))
      .then(() => {
        this.setState({ selectedFileName: '' });
        dispatch(loadMedia());
      });
  }

  render() {
    const { isVisible, canInsert, files, forImage } = this.props;
    const filteredFiles = forImage ? this.filterImages(files) : files;
    const tableData = files ? this.toTableData(filteredFiles) : [];
    return (
      <Dialog
        type="fullscreen"
        active={isVisible}
        onEscKeyDown={this.handleClose}
        onOverlayClick={this.handleClose}
        theme={dialogTheme}
        className={styles.dialog}
      >
        <h1>{forImage ? 'Images' : 'Assets'}</h1>
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
              <TableRow key={idx} selected={this.state.selectedFileName === file.name }>
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{bytes(file.size, { decimalPlaces: 0 })}</TableCell>
              </TableRow>
            )
          }
        </Table>
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
