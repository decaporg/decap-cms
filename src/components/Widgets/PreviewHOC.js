import React from 'react';

class PreviewHOC extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.value !== this.props.value;
  }

  render() {
    const { previewComponent, ...props } = this.props;
    return React.createElement(previewComponent, props);
  }
}

export default PreviewHOC;
