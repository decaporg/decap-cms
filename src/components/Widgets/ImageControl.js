import React from 'react';

export default class ImageControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileInputRef = this.handleFileInputRef.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
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

    // Iterate to list of files and return the first image on the list
    const file = files.find((currentFile) => {
      if (imageType.test(currentFile.type)) {
        return currentFile;
      }
    });

    this.props.onChange(file);
  }

  render() {
    return (
      <div
          onClick={this.handleClick}
          onDragEnter={this.handleDragEnter}
          onDragOver={this.handleDragOver}
          onDrop={this.handleChange}
      >
        Click or drop image here.
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
