import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled, { cx } from 'react-emotion';
import { get, isEmpty, debounce } from 'lodash';
import { List } from 'immutable';
import { Value, Document, Block, Text } from 'slate';
import { Editor as Slate } from 'slate-react';
import { slateToMarkdown, markdownToSlate, htmlToSlate } from '../serializers';
import Toolbar from '../MarkdownControl/Toolbar';
import { renderNode, renderMark } from './renderers';
import { validateNode } from './validators';
import plugins, { EditListConfigured } from './plugins';
import onKeyDown from './keys';
import visualEditorStyles from './visualEditorStyles';
import { EditorControlBar } from '../styles';

const VisualEditorContainer = styled.div`
  position: relative;
`;

const createEmptyRawDoc = () => {
  const emptyText = Text.create('');
  const emptyBlock = Block.create({ object: 'block', type: 'paragraph', nodes: [emptyText] });
  return { nodes: [emptyBlock] };
};

const createSlateValue = rawValue => {
  const rawDoc = rawValue && markdownToSlate(rawValue);
  const rawDocHasNodes = !isEmpty(get(rawDoc, 'nodes'));
  const document = Document.fromJSON(rawDocHasNodes ? rawDoc : createEmptyRawDoc());
  return Value.create({ document });
};

export default class Editor extends React.Component {
  static propTypes = {
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onMode: PropTypes.func.isRequired,
    className: PropTypes.string.isRequired,
    value: PropTypes.string,
    field: ImmutablePropTypes.map.isRequired,
    getEditorComponents: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      value: createSlateValue(props.value),
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
  };

  selectionHasMark = type => this.state.value.activeMarks.some(mark => mark.type === type);
  selectionHasBlock = type => this.state.value.blocks.some(node => node.type === type);

  handleMarkClick = (event, type) => {
    event.preventDefault();
    const resolvedChange = this.state.value
      .change()
      .focus()
      .toggleMark(type);
    this.ref.onChange(resolvedChange);
    this.setState({ value: resolvedChange.value });
  };

  handleBlockClick = (event, type) => {
    event.preventDefault();
    let { value } = this.state;
    const { document: doc } = value;
    const { unwrapList, wrapInList } = EditListConfigured.changes;
    let change = value.change();

    // Handle everything except list buttons.
    if (!['bulleted-list', 'numbered-list'].includes(type)) {
      const isActive = this.selectionHasBlock(type);
      change = change.setBlocks(isActive ? 'paragraph' : type);
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
    } else {
      const url = window.prompt('Enter the URL of the link');

      // If nothing is entered in the URL prompt, do nothing.
      if (!url) return;

      // If no text is selected, use the entered URL as text.
      if (change.value.isCollapsed) {
        change = change.insertText(url).extend(0 - url.length);
      }

      change = change.wrapInline({ type: 'link', data: { url } }).collapseToEnd();
    }

    this.ref.onChange(change);
    this.setState({ value: change.value });
  };

  handlePluginAdd = pluginId => {
    const { getEditorComponents } = this.props;
    const { value } = this.state;
    const nodes = [Text.create('')];
    const pluginFields = getEditorComponents()
      .get(pluginId)
      .get('fields', List());
    const shortcodeData = pluginFields
      .map(field => field.get('default'))
      .filter(val => val)
      .toMap()
      .mapKeys((idx, field) => field.get('name'));
    const block = {
      object: 'block',
      type: 'shortcode',
      data: {
        shortcode: pluginId,
        shortcodeNew: true,
        shortcodeData,
      },
      isVoid: true,
      nodes,
    };
    let change = value.change();
    const { focusBlock } = change.value;

    if (focusBlock.text === '' && focusBlock.type === 'paragraph') {
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

  handleDocumentChange = debounce(change => {
    const { onChange } = this.props;
    const raw = change.value.document.toJSON();
    const markdown = slateToMarkdown(raw);
    onChange(markdown);
  }, 150);

  handleChange = change => {
    if (!this.state.value.document.equals(change.value.document)) {
      this.handleDocumentChange(change);
    }
    this.setState({ value: change.value });
  };

  processRef = ref => {
    this.ref = ref;
  };

  render() {
    const { onAddAsset, getAsset, className, field, getEditorComponents } = this.props;

    return (
      <VisualEditorContainer>
        <EditorControlBar>
          <Toolbar
            onMarkClick={this.handleMarkClick}
            onBlockClick={this.handleBlockClick}
            onLinkClick={this.handleLink}
            selectionHasMark={this.selectionHasMark}
            selectionHasBlock={this.selectionHasBlock}
            selectionHasLink={this.hasLinks}
            onToggleMode={this.handleToggle}
            plugins={getEditorComponents()}
            onSubmit={this.handlePluginAdd}
            onAddAsset={onAddAsset}
            getAsset={getAsset}
            buttons={field.get('buttons')}
          />
        </EditorControlBar>
        <Slate
          className={cx(className, visualEditorStyles)}
          value={this.state.value}
          renderNode={renderNode}
          renderMark={renderMark}
          validateNode={validateNode}
          plugins={plugins}
          onChange={this.handleChange}
          onKeyDown={onKeyDown}
          onPaste={this.handlePaste}
          ref={this.processRef}
          spellCheck
        />
      </VisualEditorContainer>
    );
  }
}
