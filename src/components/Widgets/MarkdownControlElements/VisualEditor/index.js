import React, { Component } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import history from 'prosemirror-history';
import {
  blockQuoteRule, orderedListRule, bulletListRule, codeBlockRule, headingRule,
  inputRules, allInputRules,
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { schema, defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { baseKeymap, setBlockType, toggleMark } from 'prosemirror-commands';
import { buildKeymap } from './keymap';
import Toolbar from '../Toolbar';
import styles from './index.css';

function buildInputRules(schema) {
  let result = [], type;
  if (type = schema.nodes.blockquote) result.push(blockQuoteRule(type));
  if (type = schema.nodes.ordered_list) result.push(orderedListRule(type));
  if (type = schema.nodes.bullet_list) result.push(bulletListRule(type));
  if (type = schema.nodes.code_block) result.push(codeBlockRule(type));
  if (type = schema.nodes.heading) result.push(headingRule(type, 6));
  return result;
}

export default class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.view = new EditorView(this.ref, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(this.props.value || ''),
        schema,
        plugins: [
          inputRules({
            rules: allInputRules.concat(buildInputRules(schema)),
          }),
          keymap(buildKeymap(schema, {
            'Mod-z': history.undo,
            'Mod-y': history.redo,
          })),
          keymap(baseKeymap),
          history.history(),
        ],
      }),
      onAction: this.handleAction,
    });
  }

  handleAction = (action) => {
    const newState = this.view.state.applyAction(action);
    switch (action.type) {
      case 'selection':
        this.handleSelection(newState);
      default:
        const md = defaultMarkdownSerializer.serialize(newState.doc);
        this.props.onChange(md);
    }
    this.view.updateState(newState);
    this.view.focus();
  };

  handleSelection = (state) => {
    const { selection } = state;
    if (selection.from === selection.to) {
      const pos = this.view.coordsAtPos(selection.from);
      const editorPos = this.view.content.getBoundingClientRect();
      const selectionPosition = { top: pos.top - editorPos.top, left: pos.left - editorPos.left };
      this.setState({ showToolbar: false, selectionPosition });
    } else {
      this.setState({ showToolbar: true });
    }
  };

  handleRef = (ref) => {
    this.ref = ref;
  };

  handleHeader = level => (
    () => {
      const command = setBlockType(schema.nodes.heading, { level });
      command(this.view.state, this.handleAction);
    }
  );

  handleBold = () => {
    const command = toggleMark(schema.marks.strong);
    command(this.view.state, this.handleAction);
  };

  handleItalic = () => {
    const command = toggleMark(schema.marks.em);
    command(this.view.state, this.handleAction);
  };

  handleToggle = () => {
    this.props.onMode('raw');
  };

  render() {
    const { showToolbar, selectionPosition } = this.state;

    return (<div className={styles.editor}>
      <Toolbar
        isOpen={showToolbar}
        selectionPosition={selectionPosition}
        onH1={this.handleHeader(1)}
        onH2={this.handleHeader(2)}
        onBold={this.handleBold}
        onItalic={this.handleItalic}
        onLink={this.handleLink}
        onToggleMode={this.handleToggle}
      />
      <div ref={this.handleRef} />
    </div>);
  }
}
