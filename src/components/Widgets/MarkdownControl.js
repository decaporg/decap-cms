import React, { PropTypes } from 'react';
import VisualEditor from './MarkdownControlElements/VisualEditor';

class MarkdownControl extends React.Component {
  render() {
    const { onChange, onAddMedia, getMedia, value } = this.props;
    return (
      <VisualEditor
          onChange={onChange}
          onAddMedia={onAddMedia}
          getMedia={getMedia}
          value={value}
      />
    );
  }
}

export default MarkdownControl;

MarkdownControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  onAddMedia: PropTypes.func.isRequired,
  getMedia: PropTypes.func.isRequired,
  value: PropTypes.node,
};
