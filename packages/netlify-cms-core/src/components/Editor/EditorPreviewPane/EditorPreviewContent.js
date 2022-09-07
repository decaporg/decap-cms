import PropTypes from 'prop-types';
import React from 'react';
import { isElement } from 'react-is';

/**
 * We need to create a lightweight component here so that we can access the
 * context within the Frame. This allows us to attach the ScrollSyncPane to the
 * body.
 */
class PreviewContent extends React.Component {
  render() {
    const { previewComponent, previewProps } = this.props;
    return isElement(previewComponent)
      ? React.cloneElement(previewComponent, previewProps)
      : React.createElement(previewComponent, previewProps);
  }
}

PreviewContent.propTypes = {
  previewComponent: PropTypes.func.isRequired,
  previewProps: PropTypes.object,
};

export default PreviewContent;
