import React from 'react';

class PreviewHOC extends React.Component {
  shouldComponentUpdate(nextProps) {
    // Only re-render on value change, but always re-render objects and lists.
    // Their child widgets will each also be wrapped with this component, and
    // will only be updated on value change.
    const isWidgetContainer = ['object', 'list'].includes(nextProps.field.get('widget'));
    return isWidgetContainer || this.props.value !== nextProps.value;
  }

  render() {
    const { previewComponent, ...props } = this.props;
    return React.createElement(previewComponent, props);
  }
}

export default PreviewHOC;
