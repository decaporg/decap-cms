import React from 'react';
import ImageProxy from '../../valueObjects/ImageProxy';

export default class ImageControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentImage: {
        file: null,
        imageProxy: new ImageProxy(props.value, null, null, true)
      }
    };

    this.revokeCurrentObjectURL = this.revokeCurrentObjectURL.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileInputRef = this.handleFileInputRef.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.renderImageName = this.renderImageName.bind(this);
  }

  componentWillUnmount() {
    this.revokeCurrentObjectURL();
  }

  revokeCurrentObjectURL() {
    if (this.state.currentImage.file) {
      window.URL.revokeObjectURL(this.state.currentImage.file);
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
    this.revokeCurrentObjectURL();
    let imageRef = null;
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
      imageRef = new ImageProxy(file.name, file.size, window.URL.createObjectURL(file));
    }

    this.props.onChange(imageRef);
    this.setState({currentImage: {file:file, imageProxy: imageRef}});
  }

  renderImageName() {
    if (!this.state.currentImage.imageProxy) return null;
    return this.state.currentImage.imageProxy.uri;
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
