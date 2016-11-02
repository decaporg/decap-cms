import React, { Component } from 'react';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import history from 'prosemirror-history';
import {
  blockQuoteRule, orderedListRule, bulletListRule, codeBlockRule, headingRule,
  inputRules, allInputRules,
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { replaceWith } from 'prosemirror-transform';
import { schema, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { baseKeymap, setBlockType, toggleMark } from 'prosemirror-commands';
import registry from '../../../../lib/registry';
import { buildKeymap } from './keymap';
import createMarkdownParser from './parser';
import Toolbar from '../Toolbar';
import BlockMenu from '../BlockMenu';
import styles from './index.css';

function processUrl(url) {
  if (url.match(/^(https?:\/\/|mailto:|\/)/)) {
    return url;
  }
  if (url.match(/^[^\/]+\.[^\/]+/)) {
    return `https://${ url }`;
  }
  return `/${ url }`;
}

function buildInputRules(schema) {
  let result = [], type;
  if (type = schema.nodes.blockquote) result.push(blockQuoteRule(type));
  if (type = schema.nodes.ordered_list) result.push(orderedListRule(type));
  if (type = schema.nodes.bullet_list) result.push(bulletListRule(type));
  if (type = schema.nodes.code_block) result.push(codeBlockRule(type));
  if (type = schema.nodes.heading) result.push(headingRule(type, 6));
  return result;
}

function markActive(state, type) {
  const { from, to, empty } = state.selection;
  if (empty) {
    return type.isInSet(state.storedMarks || state.doc.marksAt(from));
  }
  return state.doc.rangeHasMark(from, to, type);
}

function schemaWithPlugins(schema, plugins) {
  let nodeSpec = schema.nodeSpec;
  plugins.forEach((plugin) => {
    const attrs = {};
    plugin.get('fields').forEach((field) => {
      attrs[field.get('name')] = { default: null };
    });
    nodeSpec = nodeSpec.addToEnd(`plugin_${ plugin.get('id') }`, {
      attrs,
      group: 'block',
      parseDOM: [{
        tag: 'div[data-plugin]',
        getAttrs(dom) {
          return JSON.parse(dom.getAttribute('data-plugin'));
        },
      }],
      toDOM(node) {
        return ['div', { 'data-plugin': JSON.stringify(node.attrs) }, plugin.get('label')];
      },
    });
  });

  return new Schema({
    nodes: nodeSpec,
    marks: schema.markSpec,
  });
}

function createSerializer(schema, plugins) {
  const serializer = Object.create(defaultMarkdownSerializer);
  plugins.forEach((plugin) => {
    serializer.nodes[`plugin_${ plugin.get('id') }`] = (state, node) => {
      const toBlock = plugin.get('toBlock');
      state.write(toBlock.call(plugin, node.attrs));
    };
  });
  return serializer;
}

export default class Editor extends Component {
  constructor(props) {
    super(props);
    const plugins = registry.getEditorComponents();
    const s = schemaWithPlugins(schema, plugins);
    this.state = {
      plugins,
      schema: s,
      parser: createMarkdownParser(s),
      serializer: createSerializer(s, plugins),
    };
  }

  componentDidMount() {
    const { schema, parser } = this.state;
    this.view = new EditorView(this.ref, {
      state: EditorState.create({
        doc: parser.parse(this.props.value || ''),
        schema,
        plugins: [
          inputRules({
            rules: allInputRules.concat(buildInputRules(schema)),
          }),
          keymap(buildKeymap(schema)),
          keymap(baseKeymap),
          history.history(),
          keymap({
            'Mod-z': history.undo,
            'Mod-y': history.redo,
          }),
        ],
      }),
      onAction: this.handleAction,
    });
  }

  handleAction = (action) => {
    const { schema, serializer } = this.state;
    const newState = this.view.state.applyAction(action);
    const md = serializer.serialize(newState.doc);
    this.props.onChange(md);
    this.view.updateState(newState);
    if (newState.selection !== this.state.selection) {
      this.handleSelection(newState);
    }
    this.view.focus();
  };

  handleSelection = (state) => {
    const { schema, selection } = state;
    if (selection.from === selection.to) {
      const { $from } = selection;
      if ($from.parent && $from.parent.type === schema.nodes.paragraph && $from.parent.textContent === '') {
        const pos = this.view.coordsAtPos(selection.from);
        const editorPos = this.view.content.getBoundingClientRect();
        const selectionPosition = { top: pos.top - editorPos.top, left: pos.left - editorPos.left };
        this.setState({ showToolbar: false, showBlockMenu: true, selectionPosition });
      } else {
        this.setState({ showToolbar: false, showBlockMenu: false });
      }
    } else {
      const pos = this.view.coordsAtPos(selection.from);
      const editorPos = this.view.content.getBoundingClientRect();
      const selectionPosition = { top: pos.top - editorPos.top, left: pos.left - editorPos.left };
      this.setState({ showToolbar: true, showBlockMenu: false, selectionPosition });
    }
  };

  handleRef = (ref) => {
    this.ref = ref;
  };

  handleHeader = level => (
    () => {
      const { schema } = this.state;
      const state = this.view.state;
      const { $from, to, node } = state.selection;
      let nodeType = schema.nodes.heading;
      let attrs = { level };
      let inHeader = node && node.hasMarkup(nodeType, attrs);
      if (!inHeader) {
        inHeader = to <= $from.end() && $from.parent.hasMarkup(nodeType, attrs);
      }
      if (inHeader) {
        nodeType = schema.nodes.paragraph;
        attrs = {};
      }

      const command = setBlockType(nodeType, { level });
      command(state, this.handleAction);
    }
  );

  handleBold = () => {
    const command = toggleMark(this.state.schema.marks.strong);
    command(this.view.state, this.handleAction);
  };

  handleItalic = () => {
    const command = toggleMark(this.state.schema.marks.em);
    command(this.view.state, this.handleAction);
  };

  handleLink = () => {
    let url = null;
    if (!markActive(this.view.state, this.state.schema.marks.link)) {
      url = prompt('Link URL:');
    }
    const command = toggleMark(this.state.schema.marks.link, { href: url ? processUrl(url) : null });
    command(this.view.state, this.handleAction);
  };

  handleBlock = (plugin, data) => {
    const { schema } = this.state;
    const nodeType = schema.nodes[`plugin_${ plugin.get('id') }`];
    this.view.props.onAction(this.view.state.tr.replaceSelection(nodeType.create(data.toJS())).action());
  };

  handleToggle = () => {
    this.props.onMode('raw');
  };

  render() {
    const { onAddMedia, onRemoveMedia, getMedia } = this.props;
    const { plugins, showToolbar, showBlockMenu, selectionPosition } = this.state;

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
      <BlockMenu
        isOpen={showBlockMenu}
        selectionPosition={selectionPosition}
        plugins={plugins}
        onBlock={this.handleBlock}
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
        getMedia={getMedia}
      />
      <div ref={this.handleRef} />
    </div>);
  }
}
