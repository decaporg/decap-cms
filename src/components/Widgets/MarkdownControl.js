import React, { PropTypes } from 'react';
import registry from '../../lib/registry';
import RawEditor from './MarkdownControlElements/RawEditor';
import VisualEditor from './MarkdownControlElements/VisualEditor';
import { processEditorPlugins } from './richText';
import { connect } from 'react-redux';
import { switchVisualMode } from '../../actions/editor';

class MarkdownControl extends React.Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onAddMedia: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    switchVisualMode: PropTypes.func.isRequired,
    value: PropTypes.node,
  };

  constructor(props) {
    super(props);
    this.state = { mode: 'visual' };
  }

  componentWillMount() {
    processEditorPlugins(registry.getEditorComponents());
  }

  handleMode = (mode) => {
    this.setState({ mode });
  };

  render() {
    const { onChange, onAddMedia, onRemoveMedia, getMedia, value } = this.props;
    const { mode } = this.state;
    if (mode === 'visual') {
      return (
        <div className="cms-editor-visual">
          <VisualEditor
            onChange={onChange}
            onAddMedia={onAddMedia}
            onRemoveMedia={onRemoveMedia}
            onMode={this.handleMode}
            getMedia={getMedia}
            value={value}
          />
        </div>
      );
    }

    return (
      <div className="cms-editor-raw">
        <RawEditor
          onChange={onChange}
          onAddMedia={onAddMedia}
          onRemoveMedia={onRemoveMedia}
          onMode={this.handleMode}
          getMedia={getMedia}
          value={value}
        />
      </div>
    );
  }
}

export default connect(
  state => ({ editor: state.editor }),
  { switchVisualMode }
)(MarkdownControl);
