import React, { PropTypes } from 'react';
import registry from '../../lib/registry';
import RawEditor from './MarkdownControlElements/RawEditor';
import VisualEditor from './MarkdownControlElements/VisualEditor';
import { processEditorPlugins } from './richText';
import { connect } from 'react-redux';
import { switchVisualMode } from '../../actions/editor';

const MODE_STORAGE_KEY = 'cms.md-mode';

class MarkdownControl extends React.Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    switchVisualMode: PropTypes.func.isRequired,
    value: PropTypes.node,
  };

  constructor(props) {
    super(props);
    this.state = { mode: localStorage.getItem(MODE_STORAGE_KEY) || 'visual' };
  }

  componentWillMount() {
    processEditorPlugins(registry.getEditorComponents());
  }

  handleMode = (mode) => {
    this.setState({ mode });
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  render() {
    const { onChange, onAddAsset, onRemoveAsset, getAsset, value } = this.props;
    const { mode } = this.state;
    if (mode === 'visual') {
      return (
        <div className="cms-editor-visual">
          <VisualEditor
            onChange={onChange}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
            onMode={this.handleMode}
            getAsset={getAsset}
            value={value}
          />
        </div>
      );
    }

    return (
      <div className="cms-editor-raw">
        <RawEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          onRemoveAsset={onRemoveAsset}
          onMode={this.handleMode}
          getAsset={getAsset}
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
