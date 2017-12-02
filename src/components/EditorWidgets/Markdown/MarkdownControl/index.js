import PropTypes from 'prop-types';
import React from 'react';
import { StickyContainer } from 'UI/Sticky/Sticky';
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

  render() {
    const {
      onChange,
      onAddAsset,
      getAsset,
      value,
      className,
      setActiveStyle,
      setInactiveStyle,
      hasActiveStyle,
    } = this.props;

    const { mode } = this.state;
    const visualEditor = (
      <div className="cms-editor-visual">
        <VisualEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={className}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          hasActiveStyle={hasActiveStyle}
          value={value}
        />
      </div>
    );
    const rawEditor = (
      <div className="cms-editor-raw">
        <RawEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={className}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          hasActiveStyle={hasActiveStyle}
          value={value}
        />
      </div>
    );
    return <StickyContainer>{ mode === 'visual' ? visualEditor : rawEditor }</StickyContainer>;
  }
}
