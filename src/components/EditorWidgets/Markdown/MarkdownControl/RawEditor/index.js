import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import { Editor as Slate } from 'slate-react';
import Plain from 'slate-plain-serializer';
import { debounce } from 'lodash';
import Toolbar from 'EditorWidgets/Markdown/MarkdownControl/Toolbar/Toolbar';

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: Plain.deserialize(this.props.value || ''),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.value.equals(nextState.value);
  }

  handleChange = change => {
    if (!this.state.value.document.equals(change.value.document)) {
      this.handleDocumentChange(change);
    }
    this.setState({ value: change.value });
  };

  /**
   * When the document value changes, serialize from Slate's AST back to plain
   * text (which is Markdown) and pass that up as the new value.
   */
  handleDocumentChange = debounce(change => {
    const value = Plain.serialize(change.value);
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
    const { className, field } = this.props;
    return (
      <div className="nc-rawEditor-rawWrapper">
        <div className="nc-visualEditor-editorControlBar">
          <Toolbar
            onToggleMode={this.handleToggleMode}
            buttons={field.get('buttons')}
            className="nc-markdownWidget-toolbarRaw"
            disabled
            rawMode
          />
        </div>
        <Slate
          className={`${className} nc-rawEditor-rawEditor`}
          value={this.state.value}
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
  className: PropTypes.string.isRequired,
  value: PropTypes.string,
  field: ImmutablePropTypes.map
};
