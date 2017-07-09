import React, { PropTypes } from 'react';
import { Editor as SlateEditor, Plain as SlatePlain } from 'slate';
import { markdownToHtml, htmlToMarkdown } from '../../unified';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import styles from './index.css';

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    const value = htmlToMarkdown(this.props.value);
    this.state = {
      editorState: SlatePlain.deserialize(value || ''),
    };
  }

  handleChange = editorState => {
    this.setState({ editorState });
  }

  handleDocumentChange = (doc, editorState) => {
    const value = SlatePlain.serialize(editorState);
    const html = markdownToHtml(value);
    this.props.onChange(html);
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
        />
      </div>
    );
  }
}

RawEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  value: PropTypes.node,
};
