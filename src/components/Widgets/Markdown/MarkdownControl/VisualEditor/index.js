import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { get, isEmpty, debounce } from 'lodash';
import { Value, Document, Block, Text } from 'slate';
import { Editor as Slate } from 'slate-react';
import { slateToMarkdown, markdownToSlate, htmlToSlate } from '../../serializers';
import registry from '../../../../../lib/registry';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import { renderNode, renderMark } from './renderers';
import { validateNode } from './validators';
import plugins, { EditListConfigured } from './plugins';
import onKeyDown from './keys';

export default class Editor extends Component {
  constructor(props) {
    super(props);
    const emptyText = Text.create('');
    const emptyBlock = Block.create({ kind: 'block', type: 'paragraph', nodes: [ emptyText ] });
    const emptyRawDoc = { nodes: [emptyBlock] };
    const rawDoc = this.props.value && markdownToSlate(this.props.value);
    const rawDocHasNodes = !isEmpty(get(rawDoc, 'nodes'))
    const document = Document.fromJSON(rawDocHasNodes ? rawDoc : emptyRawDoc);
    const value = Value.create({ document });
    this.state = {
      value,
      shortcodePlugins: registry.getEditorComponents(),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.value.equals(nextState.value);
  }

  handlePaste = (e, data, change) => {
    if (data.type !== 'html' || data.isShift) {
      return;
    }
    const ast = htmlToSlate(data.html);
    const doc = Document.fromJSON(ast);
    return change.insertFragment(doc);
  }

  hasMark = type => this.state.value.activeMarks.some(mark => mark.type === type);
  hasBlock = type => this.state.value.blocks.some(node => node.type === type);

  handleMarkClick = (event, type) => {
    event.preventDefault();
    const resolvedChange = this.state.value.change().focus().toggleMark(type);
    this.ref.onChange(resolvedChange);
    this.setState({ value: resolvedChange.value });
  };

  handleBlockClick = (event, type) => {
    event.preventDefault();
    let { value } = this.state;
    const { document: doc, selection } = value;
    const { unwrapList, wrapInList } = EditListConfigured.changes;
    let change = value.change();

    // Handle everything except list buttons.
    if (!['bulleted-list', 'numbered-list'].includes(type)) {
      const isActive = this.hasBlock(type);
      change = change.setBlock(isActive ? 'paragraph' : type);
    }

    // Handle the extra wrapping required for list buttons.
    else {
      const isSameListType = value.blocks.some(block => {
        return !!doc.getClosest(block.key, parent => parent.type === type);
      });
      const isInList = EditListConfigured.utils.isSelectionInList(value);

      if (isInList && isSameListType) {
        change = change.call(unwrapList, type);
      } else if (isInList) {
        const currentListType = type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list';
        change = change.call(unwrapList, currentListType).call(wrapInList, type);
      } else {
        change = change.call(wrapInList, type);
      }
    }

    const resolvedChange = change.focus();
    this.ref.onChange(resolvedChange);
    this.setState({ value: resolvedChange.value });
  };

  hasLinks = () => {
    return this.state.value.inlines.some(inline => inline.type === 'link');
  };

  handleLink = () => {
    let change = this.state.value.change();

    // If the current selection contains links, clicking the "link" button
    // should simply unlink them.
    if (this.hasLinks()) {
      change = change.unwrapInline('link');
    }

    else {
      const url = window.prompt('Enter the URL of the link');

      // If nothing is entered in the URL prompt, do nothing.
      if (!url) return;

      // If no text is selected, use the entered URL as text.
      if (change.value.isCollapsed) {
        change = change
          .insertText(url)
          .extend(0 - url.length);
      }

      change = change
        .wrapInline({ type: 'link', data: { url } })
        .collapseToEnd();
    }

    this.ref.onChange(change);
    this.setState({ value: change.value });
  };

  handlePluginSubmit = (plugin, shortcodeData) => {
    const { value } = this.state;
    const data = {
      shortcode: plugin.id,
      shortcodeData,
    };
    const nodes = [Text.create('')];
    const block = { kind: 'block', type: 'shortcode', data, isVoid: true, nodes };
    let change = value.change();
    const { focusBlock } = change.value;

    if (focusBlock.text === '') {
      change = change.setNodeByKey(focusBlock.key, block);
    } else {
      change = change.insertBlock(block);
    }

    change = change.focus();

    this.ref.onChange(change);
    this.setState({ value: change.value });
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

  handleDocumentChange = debounce(change => {
    const raw = change.value.document.toJSON();
    const plugins = this.state.shortcodePlugins;
    const markdown = slateToMarkdown(raw, plugins);
    this.props.onChange(markdown);
  }, 150);

  handleChange = change => {
    if (!this.state.value.document.equals(change.value.document)) {
      this.handleDocumentChange(change);
    }
    this.setState({ value: change.value });
  };

  render() {
    const { onAddAsset, onRemoveAsset, getAsset } = this.props;

    return (
      <div className="nc-visualEditor-wrapper">
        <Sticky
          className="nc-visualEditor-editorControlBar"
          classNameActive="nc-visualEditor-editorControlBarSticky"
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
          className="nc-visualEditor-editor"
          value={this.state.value}
          renderNode={renderNode}
          renderMark={renderMark}
          validateNode={validateNode}
          plugins={plugins}
          onChange={this.handleChange}
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
