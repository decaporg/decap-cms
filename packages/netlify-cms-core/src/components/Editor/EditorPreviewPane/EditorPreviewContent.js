import PropTypes from 'prop-types';
import React from 'react';
import { isElement } from 'react-is';
import { ScrollSyncPane } from 'react-scroll-sync';

/**
 * We need to create a lightweight component here so that we can access the
 * context within the Frame. This allows us to attach the ScrollSyncPane to the
 * body.
 */
class PreviewContent extends React.Component {
  render() {
    const { previewComponent, previewProps } = this.props;
    return (
      <ScrollSyncPane attachTo={this.context.document.scrollingElement}>
        {isElement(previewComponent)
          ? React.cloneElement(previewComponent, previewProps)
          : React.createElement(previewComponent, previewProps)}
      </ScrollSyncPane>
    );
  }
}

PreviewContent.contextTypes = {
  document: PropTypes.any,
};

PreviewContent.propTypes = {
  previewComponent: PropTypes.func.isRequired,
  previewProps: PropTypes.object,
};

export default PreviewContent;
