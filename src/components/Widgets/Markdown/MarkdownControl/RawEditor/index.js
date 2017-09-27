import PropTypes from 'prop-types';
import React from 'react';
import { Editor as Slate } from 'slate-react';
import Plain from 'slate-plain-serializer';
import { debounce } from 'lodash';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import { prefixer } from '../../../../../lib/styleHelper';

const styles = prefixer('rawEditor');
const visualEditorStyles = prefixer('visualEditor');

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

  handleChange = change => {
    if (!this.state.editorState.document.equals(change.state.document)) {
      this.handleDocumentChange(change);
    }
    this.setState({ editorState: change.state });
  };

  /**
   * When the document value changes, serialize from Slate's AST back to plain
   * text (which is Markdown) and pass that up as the new value.
   */
  handleDocumentChange = debounce(change => {
    const value = Plain.serialize(change.state);
    this.props.onChange(value);
  }, 150);

  /**
   * If a paste contains plain text, deserialize it to Slate's AST and insert
   * to the document. Selection logic (where to insert, whether to replace) is
   * handled by Slate.
   */
  handlePaste = (e, data, change) => {
    if (data.text) {
      const fragment = Plain.deserialize(data.text).document;
      return change.insertFragment(fragment);
    }
  };

  handleToggleMode = () => {
    this.props.onMode('visual');
  };

  render() {
    return (
      <div className={styles("rawWrapper")}>
        <Sticky
          className={visualEditorStyles("editorControlBar")}
          classNameActive={visualEditorStyles("editorControlBarSticky")}
          fillContainerWidth
        >
          <Toolbar onToggleMode={this.handleToggleMode} disabled rawMode />
        </Sticky>
        <Slate
          className={styles("rawEditor")}
          state={this.state.editorState}
          onChange={this.handleChange}
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
