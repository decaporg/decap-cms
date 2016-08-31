import React, { PropTypes } from 'react';
import RawEditor from './MarkdownControlElements/RawEditor';
import VisualEditor from './MarkdownControlElements/VisualEditor';
import { processEditorPlugins } from './richText';
import { connect } from 'react-redux';
import { switchVisualMode } from '../../actions/editor';

class MarkdownControl extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.useVisualEditor = this.useVisualEditor.bind(this);
    this.useRawEditor = this.useRawEditor.bind(this);
  }

  componentWillMount() {
    processEditorPlugins(this.context.plugins.editor);
  }

  useVisualEditor() {
    this.props.switchVisualMode(true);
  }

  useRawEditor() {
    this.props.switchVisualMode(false);
  }

  renderEditor() {
    const { editor, onChange, onAddMedia, getMedia, value } = this.props;
    if (editor.get('useVisualMode')) {
      return (
        <div>
          <button onClick={this.useRawEditor}>Switch to Raw Editor</button>
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
        <div>
          <button onClick={this.useVisualEditor}>Switch to Visual Editor</button>
          <RawEditor
              onChange={onChange}
              onAddMedia={onAddMedia}
              getMedia={getMedia}
              value={value}
          />
        </div>
      );
    }
  }

  render() {
    return (
      <div>

        { this.renderEditor() }
      </div>
    );
  }
}

export default MarkdownControl;

MarkdownControl.propTypes = {
  editor: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onAddMedia: PropTypes.func.isRequired,
  getMedia: PropTypes.func.isRequired,
  switchVisualMode: PropTypes.func.isRequired,
  value: PropTypes.node,
};

MarkdownControl.contextTypes = {
  plugins: PropTypes.object,
};

export default connect(
  state => ({ editor: state.editor }),
  { switchVisualMode }
)(MarkdownControl);
