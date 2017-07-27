import React, { PropTypes } from 'react';
import registry from '../../../../lib/registry';
import { markdownToRemark, remarkToMarkdown } from '../unified';
import RawEditor from './RawEditor';
import VisualEditor from './VisualEditor';
import { StickyContainer } from '../../../UI/Sticky/Sticky';

const MODE_STORAGE_KEY = 'cms.md-mode';

/**
 * The markdown field value is persisted as a markdown string, but stringifying
 * on every keystroke is a big perf hit, so we'll register functions to perform
 * those actions only when necessary, such as after loading and before
 * persisting.
 */
registry.registerWidgetValueSerializer('markdown', {
  serialize: remarkToMarkdown,
  deserialize: markdownToRemark,
});

export default class MarkdownControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    value: PropTypes.object,
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
    const { onChange, onAddAsset, onRemoveAsset, getAsset, value } = this.props;
    const { mode } = this.state;
    const visualEditor = (
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
    const rawEditor = (
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
    return <StickyContainer>{ mode === 'visual' ? visualEditor : rawEditor }</StickyContainer>;
  }
}
