import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { ClassNames } from '@emotion/core';
import { get, isEmpty, debounce, uniq } from 'lodash';
import { List, fromJS } from 'immutable';
import { Value, Document, Block, Text } from 'slate';
import { Editor as Slate } from 'slate-react';
import { slateToMarkdown, markdownToSlate, htmlToSlate } from '../serializers';
import Toolbar from '../MarkdownControl/Toolbar';
import { renderBlock, renderInline, renderMark } from './renderers';
import { validateNode } from './validators';
import plugins from './plugins';
import onKeyDown from './keys';
import schema from './schema';
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

const createSlateValue = (rawValue, { voidCodeBlock }) => {
  const rawDoc = rawValue && markdownToSlate(rawValue, { voidCodeBlock });
  const rawDocHasNodes = !isEmpty(get(rawDoc, 'nodes'));
  const document = Document.fromJSON(rawDocHasNodes ? rawDoc : createEmptyRawDoc());
  return Value.create({ document });
};

const pluginToBlock = plugin => {
  // Handle code block component
  if (plugin.type === 'code-block') { return { type: plugin.type };
  }

  const nodes = [Text.create('')];

  /**
   * Get default values for plugin fields.
   */
  const defaultValues = plugin.fields
    .toMap()
    .mapKeys((_, field) => field.get('name'))
    .filter(field => field.has('default'))
    .map(field => field.get('default'));

  /**
   * Create new shortcode block with default values set.
   */
  return {
    object: 'block',
    type: 'shortcode',
    data: {
      shortcode: plugin.id,
      shortcodeNew: true,
      shortcodeData: defaultValues,
    },
    nodes,
  };
};

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    const editorComponents = props.getEditorComponents();
    this.shortcodeComponents = editorComponents.filter(({ type }) => type === 'shortcode');
    this.codeBlockComponent = fromJS(editorComponents.find(({ type }) => type === 'code-block'));
    this.editorComponents = this.codeBlockComponent || editorComponents.has('code-block')
      ? editorComponents
      : editorComponents.set('code-block', Map({
          label: 'Code Block',
          type: 'code-block',
        }));
    this.renderBlock = renderBlock({
      classNameWrapper: props.className,
      resolveWidget: props.resolveWidget,
      codeBlockComponent: this.codeBlockComponent,
    });
    this.renderInline = renderInline();
    this.renderMark = renderMark();
    this.schema = schema({ voidCodeBlock: !!this.codeBlockComponent });
    this.state = {
      value: createSlateValue(this.props.value, { voidCodeBlock: !!this.codeBlockComponent }),
      lastRawValue: this.props.value,
    };
  }

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
        value: createSlateValue(this.props.value, { voidCodeBlock: this.codeBlockComponent }),
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
    const { editor } = this;
    editor.focus().toggleMark(type);
  };

  handleBlockClick = (event, type) => {
    if (event) {
      event.preventDefault();
    }

    const { editor } = this;

    const getBlockNodes = block => {
      if (block.type === 'code-block' && this.codeBlockComponent) {
        return [Text.create(block.data.get('code'))];
      }
      return block.nodes;
    }

    switch (type) {
      /**
       * Headers and code blocks can only contain text. If any selected block is not a header,
       * wrap all selected blocks into selected block type. If all selected blocks are of selected
       * block type, convert each to a paragraph.
       */
      case 'heading-one':
      case 'heading-two':
      case 'heading-three':
      case 'heading-four':
      case 'heading-five':
      case 'heading-six':
        if (editor.value.blocks.every(block => block.type === type)) {
          editor.value.blocks.forEach(block => editor.setNodeByKey(block.key, 'paragraph'));
        } else {
          editor.value.blocks.forEach(block => {
            const newBlock = Block.create({ type, nodes: getBlockNodes(block) });
            editor.setNodeByKey(block.key, { type, nodes: getBlockNodes(block) });
          });
        }
        break;
      case 'code-block':
        if (editor.value.blocks.every(block => block.type === type)) {
          editor.value.blocks.forEach(block => {
            const newBlock = Block.create({ type: 'paragraph', nodes: getBlockNodes(block) });
            editor.replaceNodeByKey(block.key, newBlock);
          });
        } else {
          if (this.codeBlockComponent) {
            editor.value.blocks.forEach(block => {
              if (block.type !== type) {
                const newBlock = { type, data: { code: block.text } };
                editor.setNodeByKey(block.key, newBlock);
              }
            });
          } else {
            editor.value.blocks.forEach(block => {
              editor.setNodeByKey(block.key, type);
            });
          }
        }
        break;
      case 'quote': {
        /**
         * Quotes can contain other blocks, even other quotes. If a selection contains quotes, they
         * shouldn't be impacted. The selection's immediate parent should be checked - if it's a
         * quote, unwrap the quote (as within are only blocks), and if it's not, wrap all selected
         * blocks into a quote. Make sure text is wrapped into paragraphs.
         */

        /**
         * TODO: highlight a couple list items and hit the quote button. doesn't work.
         */
        const topBlocks = editor.value.document.getRootBlocksAtRange(editor.value.selection);
        const ancestor = editor.value.document.getCommonAncestor(topBlocks.first().key, topBlocks.last().key);
        if (ancestor.type === type) {
          editor.unwrapBlock(type);
        } else {
          editor.wrapBlock(type);
        }
        break;
      }
      case 'numbered-list':
      case 'bulleted-list': {
        editor.toggleList(type);
        break;
      }
    }

    editor.focus();
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
  };

  handlePluginAdd = plugin => {
    const block = pluginToBlock(plugin);
    const { focusBlock } = this.editor.value;

    if (focusBlock.text === '' && focusBlock.type === 'paragraph') {
      this.editor.setNodeByKey(focusBlock.key, block);
    } else {
      this.editor.insertBlock(block);
    }

    this.editor.focus();
  };

  handleToggle = () => {
    this.props.onMode('raw');
  };

  handleDocumentChange = debounce(editor => {
    const { onChange } = this.props;
    const raw = editor.value.document.toJSON();
    const markdown = slateToMarkdown(raw, { voidCodeBlock: this.codeBlockComponent });
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
    const { onAddAsset, getAsset, className, field, resolveWidget } = this.props;

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
            plugins={this.editorComponents}
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
                  ${visualEditorStyles};
                `,
              )}
              value={this.state.value}
              renderBlock={this.renderBlock}
              renderInline={this.renderInline}
              renderMark={this.renderMark}
              schema={this.schema}
              plugins={plugins}
              onKeyDown={onKeyDown}
              onChange={this.handleChange}
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
