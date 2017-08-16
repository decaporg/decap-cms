import React from 'react';
import { connect } from 'react-redux';
import Dialog from 'react-toolbox/lib/dialog';
import Table from 'react-toolbox/lib/table';
import { Button, BrowseButton } from 'react-toolbox/lib/button';
import bytes from 'bytes';
import { resolvePath } from '../../lib/pathHelper';
import { createAssetProxy } from '../../valueObjects/AssetProxy';
import { changeDraftField } from '../../actions/entries';
import { addAsset } from '../../actions/media';
import { loadMedia, persistMedia, deleteMedia, closeMediaLibrary } from '../../actions/mediaLibrary';
import styles from './MediaLibrary.css';

class MediaLibrary extends React.Component {

  state = { selection: [] };

  componentDidMount() {
    const { dispatch, closeMediaLibrary } = this.props;
    dispatch(loadMedia());
  }

  handleClose = () => {
    return this.props.dispatch(closeMediaLibrary());
  };

  handleSelect = selection => {
    this.setState({ selection });
  };

  handlePersist = event => {
    event.stopPropagation();
    event.preventDefault();
    const { selection } = this.state;
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
    const { selection } = this.state;
    const { files, dispatch, fieldName, config } = this.props;
    const file = files.find((file, key) => selection[0] === key);
    const publicPath = resolvePath(file.name, config.get('public_folder'));
    dispatch(changeDraftField(fieldName, publicPath));
    return this.handleClose();
  };

  handleDelete = () => {
    const { selection } = this.state;
    const { files, dispatch, fieldName } = this.props;
    if (!window.confirm('Are you sure you want to delete all selected media?')) {
      return;
    }
    const filesToDelete = files.filter((file, key) => selection.includes(key));
    return dispatch(deleteMedia(filesToDelete))
      .then(() => {
        this.setState({ selection: [] });
        dispatch(loadMedia());
      });
  }

  render() {
    const { isVisible, files } = this.props;
    const { selection } = this.state;

    const model = {
      name: { type: String },
      size: { type: String },
    };

    const tableData = files && files.map(file => ({
      name: file.name,
      size: bytes(file.size, { decimalPlaces: 0 }),
    }));

    return (
      <Dialog
        type="fullscreen"
        active={isVisible}
        onEscKeyDown={this.handleClose}
        onOverlayClick={this.handleClose}
        className={styles.dialog}
      >
        <h1>Assets</h1>
        <Table
          model={model}
          source={tableData}
          onSelect={this.handleSelect}
          selected={selection}
        />

        <div className={styles.footer}>
          <Button label="Delete" onClick={this.handleDelete} className={styles.buttonLeft} accent raised />
          <Button label="Close" onClick={this.handleClose} className={styles.buttonRight}/>
          <BrowseButton label="Add New" multiple onChange={this.handlePersist} className={styles.buttonRight} primary raised />
          <Button label="Insert" onClick={this.handleInsert} className={styles.buttonRight} primary raised/>
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
