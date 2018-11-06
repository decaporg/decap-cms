import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { ClassNames } from '@emotion/core';
import { get, isEmpty, debounce, uniq } from 'lodash';
import { List } from 'immutable';
import { Value, Document, Block, Text } from 'slate';
import { Editor as Slate } from 'slate-react';
import { slateToMarkdown, markdownToSlate, htmlToSlate } from '../serializers';
import Toolbar from '../MarkdownControl/Toolbar';
import { renderNode, renderMark } from './renderers';
import { validateNode } from './validators';
import plugins from './plugins';
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
      lastRawValue: props.value,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const forcePropsValue = this.shouldForcePropsValue(
      this.props.value,
      this.state.lastRawValue,
      nextProps.value,
      nextState.lastRawValue,
    );
    return !this.state.value.equals(nextState.value) || forcePropsValue;
  }

  componentDidUpdate(prevProps, prevState) {
    const forcePropsValue = this.shouldForcePropsValue(
      prevProps.value,
      prevState.lastRawValue,
      this.props.value,
      this.state.lastRawValue,
    );

    if (forcePropsValue) {
      this.setState({
        value: createSlateValue(this.props.value),
        lastRawValue: this.props.value,
      });
    }
  }

  // If the old props/state values and new state value are all the same, and
  // the new props value does not match the others, the new props value
  // originated from outside of this widget and should be used.
  shouldForcePropsValue(oldPropsValue, oldStateValue, newPropsValue, newStateValue) {
    return (
      uniq([oldPropsValue, oldStateValue, newStateValue]).length === 1 &&
      oldPropsValue !== newPropsValue
    );
  }

  handlePaste = (e, data, editor) => {
    if (data.type !== 'html' || data.isShift) {
      return;
    }
    const ast = htmlToSlate(data.html);
    const doc = Document.fromJSON(ast);
    return editor.insertFragment(doc);
  };

  selectionHasMark = type => this.state.value.activeMarks.some(mark => mark.type === type);
  selectionHasBlock = type => this.state.value.blocks.some(node => node.type === type);

  handleMarkClick = (event, type) => {
    event.preventDefault();
    this.editor.focus().toggleMark(type);
    this.setState({ value: editor.value });
  };

  handleBlockClick = (event, type) => {
    if (event) {
      event.preventDefault();
    }

    const { editor } = this;
    const { value } = editor;
    const { document: doc } = value;

    // Handle everything except list buttons.
    if (!['bulleted-list', 'numbered-list'].includes(type)) {
      const isActive = this.selectionHasBlock(type);
      editor.setBlocks(isActive ? 'paragraph' : type);
    }

    // Handle the extra wrapping required for list buttons.
    // slate-edit-list removed from project, must rewrite list handling
    /*
    const { unwrapList, wrapInList } = EditListConfigured.changes;
    else {
      const isSameListType = value.blocks.some(block => {
        return !!doc.getClosest(block.key, parent => parent.type === type);
      });
      const isInList = EditListConfigured.utils.isSelectionInList(value);

      if (isInList && isSameListType) {
        editor.command(unwrapList, type);
      } else if (isInList) {
        const currentListType = type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list';
        editor.call(unwrapList, currentListType).call(wrapInList, type);
      } else {
        editor.call(wrapInList, type);
      }
    }
    */

    editor.focus();
    this.setState({ value: editor.value });
  };

  hasLinks = () => {
    return this.state.value.inlines.some(inline => inline.type === 'link');
  };

  handleLink = () => {
    const { editor } = this;
    // If the current selection contains links, clicking the "link" button
    // should simply unlink them.
    if (this.hasLinks()) {
      editor.unwrapInline('link');
    } else {
      const url = window.prompt('Enter the URL of the link');

      // If nothing is entered in the URL prompt, do nothing.
      if (!url) return;

      // If no text is selected, use the entered URL as text.
      if (editor.value.isCollapsed) {
        editor.insertText(url).moveFocusBackward(0 - url.length);
      }

      editor.wrapInline({ type: 'link', data: { url } }).moveToEnd();
    }

    this.setState({ value: editor.value });
  };

  handlePluginAdd = pluginId => {
    const { getEditorComponents } = this.props;
    const { editor } = this;
    const nodes = [Text.create('')];

    /**
     * Get default values for plugin fields.
     */
    const pluginFields = getEditorComponents().getIn([pluginId, 'fields'], List());
    const defaultValues = pluginFields
      .toMap()
      .mapKeys((_, field) => field.get('name'))
      .filter(field => field.has('default'))
      .map(field => field.get('default'));

    /**
     * Create new shortcode block with default values set.
     */
    const block = {
      object: 'block',
      type: 'shortcode',
      data: {
        shortcode: pluginId,
        shortcodeNew: true,
        shortcodeData: defaultValues,
      },
      nodes,
    };

    const { focusBlock } = editor.value;

    if (focusBlock.text === '' && focusBlock.type === 'paragraph') {
      editor.setNodeByKey(focusBlock.key, block);
    } else {
      editor.insertBlock(block);
    }

    editor.focus();

    this.setState({ value: editor.value });
  };

  handleToggle = () => {
    this.props.onMode('raw');
  };

  handleDocumentChange = debounce(editor => {
    const { onChange } = this.props;
    const raw = editor.value.document.toJSON();
    const markdown = slateToMarkdown(raw);
    this.setState({ lastRawValue: markdown }, () => onChange(markdown));
  }, 150);

  handleChange = editor => {
    if (!this.state.value.document.equals(editor.value.document)) {
      this.handleDocumentChange(editor);
    }
    this.setState({ value: editor.value });
  };

  processRef = ref => {
    this.editor = ref;
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
        <ClassNames>
          {({ css, cx }) => (
            <Slate
              className={cx(
                className,
                css`
                  ${visualEditorStyles}
                `,
              )}
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
          )}
        </ClassNames>
      </VisualEditorContainer>
    );
  }
}
