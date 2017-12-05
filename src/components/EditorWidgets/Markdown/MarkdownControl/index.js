import PropTypes from 'prop-types';
import React from 'react';
import { markdownToRemark, remarkToMarkdown } from 'EditorWidgets/Markdown/serializers'
import RawEditor from './RawEditor';
import VisualEditor from './VisualEditor';

const MODE_STORAGE_KEY = 'cms.md-mode';

export default class MarkdownControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    className: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    hasActiveStyle: PropTypes.bool,
    value: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { mode: localStorage.getItem(MODE_STORAGE_KEY) || 'visual' };
  }

  handleMode = (mode) => {
    this.setState({ mode });
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  processRef = ref => this.ref = ref;

  render() {
    console.log(this.props.hasActiveStyle);
    const {
      onChange,
      onAddAsset,
      getAsset,
      value,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
      hasActiveStyle,
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
          hasActiveStyle={hasActiveStyle}
          value={value}
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
          hasActiveStyle={hasActiveStyle}
          value={value}
        />
      </div>
    );
    return mode === 'visual' ? visualEditor : rawEditor;
  }
}
