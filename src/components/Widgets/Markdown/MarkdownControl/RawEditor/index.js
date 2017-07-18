import React, { PropTypes } from 'react';
import { Editor as SlateEditor, Plain as SlatePlain } from 'slate';
import { markdownToRemark, remarkToMarkdown } from '../../unified';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import styles from './index.css';

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    const value = remarkToMarkdown(this.props.value);
    this.state = {
      editorState: SlatePlain.deserialize(value || ''),
    };
  }

  handleChange = editorState => {
    this.setState({ editorState });
  }

  handleDocumentChange = (doc, editorState) => {
    const value = SlatePlain.serialize(editorState);
    const html = markdownToRemark(value);
    this.props.onChange(html);
  };

  handlePaste = (e, data, state) => {
    if (data.text) {
      const fragment = SlatePlain.deserialize(data.text).document;
      return state.transform().insertFragment(fragment).apply();
    }
  };

  handleToggleMode = () => {
    this.props.onMode('visual');
  };

  render() {
    return (
      <div className={styles.root}>
        <Sticky
          className={styles.editorControlBar}
          classNameActive={styles.editorControlBarSticky}
          fillContainerWidth
        >
          <Toolbar onToggleMode={this.handleToggleMode} disabled rawMode />
        </Sticky>
        <SlateEditor
          className={styles.SlateEditor}
          state={this.state.editorState}
          onChange={this.handleChange}
          onDocumentChange={this.handleDocumentChange}
          onPaste={this.handlePaste}
        />
      </div>
    );
  }
}

RawEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  value: PropTypes.object,
};
