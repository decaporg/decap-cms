import React, { PropTypes } from 'react';
import { truncateMiddle } from '../../lib/textHelper';
import MediaProxy from '../../valueObjects/MediaProxy';

const MAX_DISPLAY_LENGTH = 50;

export default class ImageControl extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleFileInputRef = this.handleFileInputRef.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.renderImageName = this.renderImageName.bind(this);
  }

  handleFileInputRef(el) {
    this._fileInput = el;
  }

  handleClick(e) {
    this._fileInput.click();
  }

  handleDragEnter(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  handleChange(e) {
    e.stopPropagation();
    e.preventDefault();

    const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    const files = [...fileList];
    const imageType = /^image\//;

    // Iterate through the list of files and return the first image on the list
    const file = files.find((currentFile) => {
      if (imageType.test(currentFile.type)) {
        return currentFile;
      }
    });

    this.props.onRemoveMedia(this.props.value);
    if (file) {
      const mediaProxy = new MediaProxy(file.name, file);
      this.props.onAddMedia(mediaProxy);
      this.props.onChange(mediaProxy.path);
    } else {
      this.props.onChange(null);
    }

  }

  renderImageName() {
    if (!this.props.value) return null;
    if (this.value instanceof MediaProxy) {
      return truncateMiddle(this.props.value.path, MAX_DISPLAY_LENGTH);
    } else {
      return truncateMiddle(this.props.value, MAX_DISPLAY_LENGTH);
    }

  }

  render() {
    const imageName = this.renderImageName();
    return (
      <div
          onDragEnter={this.handleDragEnter}
          onDragOver={this.handleDragOver}
          onDrop={this.handleChange}
      >
        <span onClick={this.handleClick}>
          {imageName ? imageName : 'Click or drop imag here.'}
        </span>
        <input
            type="file"
            accept="image/*"
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
    display: 'none'
  }
};

ImageControl.propTypes = {
  onAddMedia: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemoveMedia: PropTypes.func.isRequired,
  value: PropTypes.node,
};
