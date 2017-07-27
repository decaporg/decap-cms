import React, { PropTypes } from 'react';
import { Editor as Slate, Plain } from 'slate';
import { markdownToRemark, remarkToMarkdown } from '../../unified';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import styles from './index.css';

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    /**
     * The value received is a Remark AST (MDAST), and must be stringified
     * to plain text before Slate's Plain serializer can convert it to the
     * Slate AST.
     */
    const value = remarkToMarkdown(this.props.value);
    this.state = {
      editorState: Plain.deserialize(value || ''),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.editorState.equals(nextState.editorState);
  }

  handleChange = editorState => {
    this.setState({ editorState });
  }

  /**
   * When the document value changes, serialize from Slate's AST back to plain
   * text (which is Markdown), and then deserialize from that to a Remark MDAST,
   * before passing up as the new value.
   */
  handleDocumentChange = (doc, editorState) => {
    const value = Plain.serialize(editorState);
    const mdast = markdownToRemark(value);
    this.props.onChange(mdast);
  };

  /**
   * If a paste contains plain text, deserialize it to Slate's AST and insert
   * to the document. Selection logic (where to insert, whether to replace) is
   * handled by Slate.
   */
  handlePaste = (e, data, state) => {
    if (data.text) {
      const fragment = Plain.deserialize(data.text).document;
      return state.transform().insertFragment(fragment).apply();
    }
  };

  handleToggleMode = () => {
    this.props.onMode('visual');
  };

  render() {
    return (
      <div className={styles.rawWrapper}>
        <Sticky
          className={styles.editorControlBar}
          classNameActive={styles.editorControlBarSticky}
          fillContainerWidth
        >
          <Toolbar onToggleMode={this.handleToggleMode} disabled rawMode />
        </Sticky>
        <Slate
          className={styles.rawEditor}
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
