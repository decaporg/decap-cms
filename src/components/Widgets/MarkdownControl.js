import React from 'react';
import {Editor, EditorState, RichUtils} from 'draft-js';
import {stateToMarkdown} from 'draft-js-export-markdown';
import {stateFromMarkdown} from 'draft-js-import-markdown';

export default class MarkdownControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createWithContent(stateFromMarkdown(props.value || ''))
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
  }

  handleChange(editorState) {
    const content = editorState.getCurrentContent();
    this.setState({editorState});
    this.props.onChange(stateToMarkdown(content));
  }

  handleKeyCommand(command) {
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);
    if (newState) {
      this.handleChange(newState);
      return true;
    }
    return false;
  }

  render() {
    const {editorState} = this.state;
    return (
      <Editor
          editorState={editorState}
          onChange={this.handleChange}
          handleKeyCommand={this.handleKeyCommand}
      />);
  }
}
