import React, { PropTypes } from 'react';
import { ScrollSyncPane } from '../ScrollSync';

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
        {React.createElement(previewComponent, previewProps)}
      </ScrollSyncPane>
    );
  }
}

PreviewContent.contextTypes = {
  document: PropTypes.any,
};

export default PreviewContent;
