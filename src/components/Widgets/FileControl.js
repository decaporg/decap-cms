import React, { PropTypes } from 'react';
import { truncateMiddle } from '../../lib/textHelper';
import { Loader } from '../UI';
import AssetProxy, { createAssetProxy } from '../../valueObjects/AssetProxy';

const MAX_DISPLAY_LENGTH = 50;

export default class FileControl extends React.Component {
  state = {
    processing: false,
  };

  promise = null;

  isValid = () => {
    if (this.promise) {
      return this.promise;
    }
    return { error: false };
  };


  handleFileInputRef = (el) => {
    this._fileInput = el;
  };

  handleClick = (e) => {
    this._fileInput.click();
  };

  handleDragEnter = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  handleDragOver = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  handleChange = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    const files = [...fileList];
    const imageType = /^image\//;

    // Return the first file on the list
    const file = files[0];

    this.props.onRemoveAsset(this.props.value);
    if (file) {
      this.setState({ processing: true });
      this.promise = createAssetProxy(file.name, file, false, this.props.field.get('private', false))
      .then((assetProxy) => {
        this.setState({ processing: false });
        this.props.onAddAsset(assetProxy);
        this.props.onChange(assetProxy.public_path);
      });
    } else {
      this.props.onChange(null);
    }
  };

  renderFileName = () => {
    if (!this.props.value) return null;
    if (this.value instanceof AssetProxy) {
      return truncateMiddle(this.props.value.path, MAX_DISPLAY_LENGTH);
    } else {
      return truncateMiddle(this.props.value, MAX_DISPLAY_LENGTH);
    }
  };

  render() {
    const { processing } = this.state;
    const fileName = this.renderFileName();
    if (processing) {
      return (
        <div style={styles.imageUpload}>
          <span style={styles.message}>
            <Loader active />
          </span>
        </div>
      );
    }
    return (
      <div
        style={styles.imageUpload}
        onDragEnter={this.handleDragEnter}
        onDragOver={this.handleDragOver}
        onDrop={this.handleChange}
      >
        <span style={styles.message} onClick={this.handleClick}>
          {fileName ? fileName : 'Tip: Click here to select a file to upload, or drag an image directly into this box from your desktop'}
        </span>
        <input
          type="file"
          onChange={this.handleChange}
          style={styles.input}
          ref={this.handleFileInputRef}
        />
      </div>
    );
  }
}

const styles = {
  input: {
    display: 'none',
  },
  message: {
    padding: '20px',
    display: 'block',
    fontSize: '12px',
  },
  imageUpload: {
    backgroundColor: '#fff',
    textAlign: 'center',
    color: '#999',
    border: '1px dashed #eee',
    cursor: 'pointer',
  },
};

FileControl.propTypes = {
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
  field: PropTypes.object,
};
