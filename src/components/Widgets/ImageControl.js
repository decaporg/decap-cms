import React from 'react';
import { truncateMiddle } from '../../lib/textHelper';

const MAX_DISPLAY_LENGTH = 50;

export default class ImageControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentImage: props.value
    };

    this.revokeCurrentImage = this.revokeCurrentImage.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileInputRef = this.handleFileInputRef.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.renderImageName = this.renderImageName.bind(this);
  }

  revokeCurrentImage() {
    if (this.state.currentImage) {
      //this.props.onRemoveMedia(this.state.currentImage);
    }
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
    this.revokeCurrentImage();
    const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    const files = [...fileList];
    const imageType = /^image\//;

    // Iterate through the list of files and return the first image on the list
    const file = files.find((currentFile) => {
      if (imageType.test(currentFile.type)) {
        return currentFile;
      }
    });

    if (file) {
      this.props.onAddMedia(file);
      this.props.onChange(file.name);
      this.setState({currentImage: file.name});
    } else {
      this.props.onChange(null);
      this.setState({currentImage: null});
    }

  }

  renderImageName() {

    if (!this.state.currentImage) return null;
    return truncateMiddle(this.props.getMedia(this.state.currentImage).uri, MAX_DISPLAY_LENGTH);
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
