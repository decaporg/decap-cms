import React, { PropTypes } from 'react';
import { Editor as Slate, Plain } from 'slate';
import { debounce } from 'lodash';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import styles from './index.css';

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: Plain.deserialize(this.props.value || ''),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.editorState.equals(nextState.editorState);
  }

  handleChange = editorState => {
    this.setState({ editorState });
  }

  onChange = debounce(this.props.onChange, 250);

  /**
   * When the document value changes, serialize from Slate's AST back to plain
   * text (which is Markdown) and pass that up as the new value.
   */
  handleDocumentChange = (doc, editorState) => {
    const value = Plain.serialize(editorState);
    this.onChange(value);
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
  value: PropTypes.string,
};
