import PropTypes from 'prop-types';
import React from 'react';
import EditorScrollSyncPane from './EditorScrollSyncPane';

/**
 * We need to create a lightweight component here so that we can access the
 * context within the Frame. This allows us to attach the ScrollSyncPane to the
 * body.
 */
class PreviewContent extends React.Component {
  render() {
    const { previewComponent, previewProps } = this.props;
    return (
      <EditorScrollSyncPane attachTo={this.context.document.scrollingElement}>
        {React.createElement(previewComponent, previewProps)}
      </EditorScrollSyncPane>
    );
  }
}

PreviewContent.contextTypes = {
  document: PropTypes.any,
};

export default PreviewContent;
