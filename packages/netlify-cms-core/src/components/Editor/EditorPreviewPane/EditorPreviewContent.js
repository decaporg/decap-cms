import PropTypes from 'prop-types';
import React from 'react';
import { isElement } from 'react-is';
import { ScrollSyncPane } from 'react-scroll-sync';
import { FrameContextConsumer } from 'react-frame-component';

/**
 * We need to create a lightweight component here so that we can access the
 * context within the Frame. This allows us to attach the ScrollSyncPane to the
 * body.
 */
class PreviewContent extends React.Component {
  render() {
    const { previewComponent, previewProps } = this.props;
    return (
      <FrameContextConsumer>
        {context => (
          <ScrollSyncPane attachTo={context.document.scrollingElement}>
            {isElement(previewComponent)
              ? React.cloneElement(previewComponent, previewProps)
              : React.createElement(previewComponent, previewProps)}
          </ScrollSyncPane>
        )}
      </FrameContextConsumer>
    );
  }
}

PreviewContent.propTypes = {
  previewComponent: PropTypes.func.isRequired,
  previewProps: PropTypes.object,
};

export default PreviewContent;
