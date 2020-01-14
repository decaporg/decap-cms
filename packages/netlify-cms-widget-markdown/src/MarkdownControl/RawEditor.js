import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { ClassNames } from '@emotion/core';
import { debounce } from 'lodash';
import { Value } from 'slate';
import { Editor as Slate, setEventTransfer } from 'slate-react';
import Plain from 'slate-plain-serializer';
import isHotkey from 'is-hotkey';
import { lengths, fonts } from 'netlify-cms-ui-default';
import { markdownToHtml } from '../serializers';
import { editorStyleVars, EditorControlBar } from '../styles';
import Toolbar from './Toolbar';

const styleStrings = {
  slateRaw: `
    position: relative;
    overflow: hidden;
    overflow-x: auto;
    min-height: ${lengths.richTextEditorMinHeight};
    font-family: ${fonts.mono};
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-top: 0;
    margin-top: -${editorStyleVars.stickyDistanceBottom};
  `,
};

const RawEditorContainer = styled.div`
  position: relative;
`;

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

  componentDidMount() {
    if (this.props.pendingFocus) {
      this.editor.focus();
      this.props.pendingFocus();
    }
  }

  handleCopy = async (event, editor) => {
    event.persist();
    const { getAsset, resolveWidget } = this.props;
    const markdown = Plain.serialize(Value.create({ document: editor.value.fragment }));
    const html = await markdownToHtml(markdown, { getAsset, resolveWidget });
    setEventTransfer(event, 'text', markdown);
    setEventTransfer(event, 'html', html);
    event.preventDefault();
  };

  handleCut = async (event, editor, next) => {
    await this.handleCopy(event, editor, next);
    editor.delete();
  };

  handlePaste = (event, editor, next) => {
    event.preventDefault();
    const data = event.clipboardData;
    if (isHotkey('shift', event)) {
      return next();
    }

    const value = Plain.deserialize(data.getData('text/plain'));
    return editor.insertFragment(value.document);
  };

  handleChange = editor => {
    if (!this.state.value.document.equals(editor.value.document)) {
      this.handleDocumentChange(editor);
    }
    this.setState({ value: editor.value });
  };

  /**
   * When the document value changes, serialize from Slate's AST back to plain
   * text (which is Markdown) and pass that up as the new value.
   */
  handleDocumentChange = debounce(editor => {
    const value = Plain.serialize(editor.value);
    this.props.onChange(value);
  }, 150);

  handleToggleMode = () => {
    this.props.onMode('visual');
  };

  processRef = ref => {
    this.editor = ref;
  };

  render() {
    const { className, field } = this.props;
    return (
      <RawEditorContainer>
        <EditorControlBar>
          <Toolbar
            onToggleMode={this.handleToggleMode}
            buttons={field.get('buttons')}
            disabled
            rawMode
          />
        </EditorControlBar>
        <ClassNames>
          {({ css, cx }) => (
            <Slate
              className={cx(
                className,
                css`
                  ${styleStrings.slateRaw}
                `,
              )}
              value={this.state.value}
              onChange={this.handleChange}
              onPaste={this.handlePaste}
              onCut={this.handleCut}
              onCopy={this.handleCopy}
              ref={this.processRef}
            />
          )}
        </ClassNames>
      </RawEditorContainer>
    );
  }
}

RawEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  value: PropTypes.string,
  field: ImmutablePropTypes.map.isRequired,
};
