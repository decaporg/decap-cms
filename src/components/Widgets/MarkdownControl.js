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

  componentWillMount() {
    this.useRawEditor();
    processEditorPlugins(registry.getEditorComponents());
  }

  useVisualEditor = () => {
    this.props.switchVisualMode(true);
  };

  useRawEditor = () => {
    this.props.switchVisualMode(false);
  };

  render() {
    const { editor, onChange, onAddMedia, onRemoveMedia, getMedia, value } = this.props;
    if (editor.get('useVisualMode')) {
      return (
        <div className="cms-editor-visual">
          {null && <button onClick={this.useRawEditor}>Switch to Raw Editor</button>}
          <VisualEditor
            onChange={onChange}
            onAddMedia={onAddMedia}
            getMedia={getMedia}
            registeredComponents={editor.get('registeredComponents')}
            value={value}
          />
        </div>
      );
    } else {
      return (
        <div className="cms-editor-raw">
          {null && <button onClick={this.useVisualEditor}>Switch to Visual Editor</button>}
          <RawEditor
            onChange={onChange}
            onAddMedia={onAddMedia}
            onRemoveMedia={onRemoveMedia}
            getMedia={getMedia}
            value={value}
          />
        </div>
      );
    }
  }
}

export default connect(
  state => ({ editor: state.editor }),
  { switchVisualMode }
)(MarkdownControl);
