import React from 'react';

export default class ImagePreview extends React.Component {
  constructor(props) {
    super(props);
    this.handleImageLoaded = this.handleImageLoaded.bind(this);
  }

  handleImageLoaded() {
    window.URL.revokeObjectURL(this.props);
  }

  render() {
    const { value } = this.props;
    return value ? <img src={window.URL.createObjectURL(value)} onLoad={this.handleImageLoaded} /> : null;
  }
}
