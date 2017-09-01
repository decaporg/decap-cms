import React, { Component, PropTypes } from 'react';
import { get, isEmpty, debounce } from 'lodash';
import { Editor as Slate, Raw, Block, Text } from 'slate';
import { slateToMarkdown, markdownToSlate, htmlToSlate } from '../../serializers';
import registry from '../../../../../lib/registry';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import { MARK_COMPONENTS, NODE_COMPONENTS } from './components';
import RULES from './rules';
import plugins, { EditListConfigured } from './plugins';
import onKeyDown from './keys';
import styles from './index.css';

export default class Editor extends Component {
  constructor(props) {
    super(props);
    const emptyBlock = Block.create({ kind: 'block', type: 'paragraph'});
    const emptyRawDoc = { nodes: [emptyBlock] };
    const rawDoc = this.props.value && markdownToSlate(this.props.value);
    const rawDocHasNodes = !isEmpty(get(rawDoc, 'nodes'))
    const editorState = Raw.deserialize(rawDocHasNodes ? rawDoc : emptyRawDoc, { terse: true });
    this.state = {
      editorState,
      schema: {
        nodes: NODE_COMPONENTS,
        marks: MARK_COMPONENTS,
        rules: RULES,
      },
      shortcodePlugins: registry.getEditorComponents(),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.editorState.equals(nextState.editorState);
  }

  handlePaste = (e, data, state) => {
    if (data.type !== 'html' || data.isShift) {
      return;
    }
    const ast = htmlToSlate(data.html);
    const { document: doc } = Raw.deserialize(ast, { terse: true });
    return state.transform().insertFragment(doc).apply();
  }

  onChange = debounce(this.props.onChange, 250);

  handleDocumentChange = (doc, editorState) => {
    const raw = Raw.serialize(editorState, { terse: true });
    const plugins = this.state.shortcodePlugins;
    const markdown = slateToMarkdown(raw, plugins);
    this.onChange(markdown);
  };

  hasMark = type => this.state.editorState.marks.some(mark => mark.type === type);
  hasBlock = type => this.state.editorState.blocks.some(node => node.type === type);

  handleMarkClick = (event, type) => {
    event.preventDefault();
    const resolvedState = this.state.editorState.transform().focus().toggleMark(type).apply();
    this.ref.onChange(resolvedState);
    this.setState({ editorState: resolvedState });
  };

  handleBlockClick = (event, type) => {
    event.preventDefault();
    let { editorState } = this.state;
    const { document: doc, selection } = editorState;
    const transform = editorState.transform();

    // Handle everything except list buttons.
    if (!['bulleted-list', 'numbered-list'].includes(type)) {
      const isActive = this.hasBlock(type);
      const transformed = transform.setBlock(isActive ? 'paragraph' : type);
    }

    // Handle the extra wrapping required for list buttons.
    else {
      const isSameListType = editorState.blocks.some(block => {
        return !!doc.getClosest(block.key, parent => parent.type === type);
      });
      const isInList = EditListConfigured.utils.isSelectionInList(editorState);

      if (isInList && isSameListType) {
        EditListConfigured.transforms.unwrapList(transform, type);
      } else if (isInList) {
        const currentListType = type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list';
        EditListConfigured.transforms.unwrapList(transform, currentListType);
        EditListConfigured.transforms.wrapInList(transform, type);
      } else {
        EditListConfigured.transforms.wrapInList(transform, type);
      }
    }

    const resolvedState = transform.focus().apply();
    this.ref.onChange(resolvedState);
    this.setState({ editorState: resolvedState });
  };

  hasLinks = () => {
    return this.state.editorState.inlines.some(inline => inline.type === 'link');
  };

  handleLink = () => {
    let { editorState } = this.state;

    // If the current selection contains links, clicking the "link" button
    // should simply unlink them.
    if (this.hasLinks()) {
      editorState = editorState.transform().unwrapInline('link').apply();
    }

    else {
      const url = window.prompt('Enter the URL of the link');

      // If nothing is entered in the URL prompt, do nothing.
      if (!url) return;

      let transform = editorState.transform();

      // If no text is selected, use the entered URL as text.
      if (editorState.isCollapsed) {
        transform = transform
          .insertText(url)
          .extend(0 - url.length);
      }

      editorState = transform
        .wrapInline({ type: 'link', data: { url } })
        .collapseToEnd()
        .apply();
    }

    this.ref.onChange(editorState);
    this.setState({ editorState });
  };

  handlePluginSubmit = (plugin, shortcodeData) => {
    const { editorState } = this.state;
    const data = {
      shortcode: plugin.id,
      shortcodeData,
    };
    const nodes = [Text.createFromString('')];
    const block = { kind: 'block', type: 'shortcode', data, isVoid: true, nodes };
    const resolvedState = editorState.transform().insertBlock(block).focus().apply();
    this.ref.onChange(resolvedState);
    this.setState({ editorState: resolvedState });
  };

  handleToggle = () => {
    this.props.onMode('raw');
  };

  getButtonProps = (type, opts = {}) => {
    const { isBlock } = opts;
    const handler = opts.handler || (isBlock ? this.handleBlockClick: this.handleMarkClick);
    const isActive = opts.isActive || (isBlock ? this.hasBlock : this.hasMark);
    return { onAction: e => handler(e, type), active: isActive(type) };
  };

  render() {
    const { onAddAsset, onRemoveAsset, getAsset } = this.props;

    return (
      <div className={styles.wrapper}>
        <Sticky
          className={styles.editorControlBar}
          classNameActive={styles.editorControlBarSticky}
          fillContainerWidth
        >
          <Toolbar
            buttons={{
              bold: this.getButtonProps('bold'),
              italic: this.getButtonProps('italic'),
              code: this.getButtonProps('code'),
              link: this.getButtonProps('link', { handler: this.handleLink, isActive: this.hasLinks }),
              h1: this.getButtonProps('heading-one', { isBlock: true }),
              h2: this.getButtonProps('heading-two', { isBlock: true }),
              list: this.getButtonProps('bulleted-list', { isBlock: true }),
              listNumbered: this.getButtonProps('numbered-list', { isBlock: true }),
              codeBlock: this.getButtonProps('code', { isBlock: true }),
              quote: this.getButtonProps('quote', { isBlock: true }),
            }}
            onToggleMode={this.handleToggle}
            plugins={this.state.shortcodePlugins}
            onSubmit={this.handlePluginSubmit}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
            getAsset={getAsset}
          />
        </Sticky>
        <Slate
          className={styles.editor}
          state={this.state.editorState}
          schema={this.state.schema}
          plugins={plugins}
          onChange={editorState => this.setState({ editorState })}
          onDocumentChange={this.handleDocumentChange}
          onKeyDown={onKeyDown}
          onPaste={this.handlePaste}
          ref={ref => this.ref = ref}
          spellCheck
        />
      </div>
    );
  }
}

Editor.propTypes = {
  onAddAsset: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  getAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  value: PropTypes.string,
};
