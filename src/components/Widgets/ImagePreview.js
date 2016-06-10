import React from 'react';

export default class ImagePreview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { value, getMedia } = this.props;
    return value ? <img src={getMedia(value)}/> : null;
  }
}
