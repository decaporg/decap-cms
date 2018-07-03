import PropTypes from 'prop-types';
import React from 'react';
import c from 'classnames';
import { markdownToRemark, remarkToMarkdown } from 'EditorWidgets/Markdown/serializers'
import RawEditor from './RawEditor';
import VisualEditor from './VisualEditor';

const MODE_STORAGE_KEY = 'cms.md-mode';

let editorControl;

export const getEditorControl = () => editorControl;

export default class MarkdownControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    editorControl: PropTypes.func.isRequired,
    value: PropTypes.string,
  };

  static defaultProps = {
    value: '',
  };

  constructor(props) {
    super(props);
    editorControl = props.editorControl;
    this.state = { mode: localStorage.getItem(MODE_STORAGE_KEY) || 'visual' };
  }

  handleMode = (mode) => {
    this.setState({ mode });
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  processRef = ref => this.ref = ref;

  render() {
    const {
      onChange,
      onAddAsset,
      getAsset,
      value,
      classNameWrapper,
      field
    } = this.props;

    const { mode } = this.state;
    const visualEditor = (
      <div className="cms-editor-visual" ref={this.processRef}>
        <VisualEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={classNameWrapper}
          value={value}
          field={field}
        />
      </div>
    );
    const rawEditor = (
      <div className="cms-editor-raw" ref={this.processRef}>
        <RawEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={classNameWrapper}
          value={value}
          field={field}
        />
      </div>
    );
    return mode === 'visual' ? visualEditor : rawEditor;
  }
}
