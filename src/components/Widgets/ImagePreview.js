import React from 'react';

export default class ImagePreview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { value } = this.props;
    return value ? <img src={value}/> : null;
  }
}
