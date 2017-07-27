import React, { Component, PropTypes } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Map, List, fromJS } from 'immutable';
import { get, reduce, mapValues } from 'lodash';
import cn from 'classnames';
import { Editor as SlateEditor, Raw as SlateRaw, Text as SlateText, Block as SlateBlock, Selection as SlateSelection} from 'slate';
import EditList from 'slate-edit-list';
import EditTable from 'slate-edit-table';
import { markdownToRemark, remarkToMarkdown, slateToRemark, remarkToSlate, markdownToHtml, htmlToSlate } from '../../unified';
import registry from '../../../../../lib/registry';
import { createAssetProxy } from '../../../../../valueObjects/AssetProxy';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import styles from './index.css';

const DEFAULT_NODE = 'paragraph';

const BLOCK_TAGS = {
  p: 'paragraph',
  li: 'list-item',
  ul: 'bulleted-list',
  ol: 'numbered-list',
  blockquote: 'quote',
  pre: 'code',
  h1: 'heading-one',
  h2: 'heading-two',
  h3: 'heading-three',
  h4: 'heading-four',
  h5: 'heading-five',
  h6: 'heading-six',
}

const MARK_TAGS = {
  strong: 'bold',
  em: 'italic',
  u: 'underline',
  s: 'strikethrough',
  del: 'strikethrough',
  code: 'code'
}

const BLOCK_COMPONENTS = {
  'container': props => <div {...props.attributes}>{props.children}</div>,
  'paragraph': props => <p {...props.attributes}>{props.children}</p>,
  'list-item': props => <li {...props.attributes}>{props.children}</li>,
  'numbered-list': props => {
    const { data } = props.node;
    const start = data.get('start') || 1;
    return <ol {...props.attributes} start={start}>{props.children}</ol>;
  },
  'bulleted-list': props => <ul {...props.attributes}>{props.children}</ul>,
  'quote': props => <blockquote {...props.attributes}>{props.children}</blockquote>,
  'code': props => <pre><code {...props.attributes}>{props.children}</code></pre>,
  'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
  'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
  'heading-three': props => <h3 {...props.attributes}>{props.children}</h3>,
  'heading-four': props => <h4 {...props.attributes}>{props.children}</h4>,
  'heading-five': props => <h5 {...props.attributes}>{props.children}</h5>,
  'heading-six': props => <h6 {...props.attributes}>{props.children}</h6>,
  'image': props => {
    const data = props.node && props.node.get('data');
    const src = data.get('url');
    const alt = data.get('alt');
    const title = data.get('title');
    return <div><img src={src} alt={alt} title={title}{...props.attributes}/></div>;
  },
  'table': props => <table><tbody {...props.attributes}>{props.children}</tbody></table>,
  'table-row': props => <tr {...props.attributes}>{props.children}</tr>,
  'table-cell': props => <td {...props.attributes}>{props.children}</td>,
  'thematic-break': props => <hr {...props.attributes}/>,
};
const getShortcodeId = props => {
  if (props.node) {
    const result = props.node.getIn(['data', 'shortcode', 'shortcodeId']);
    return result || props.node.getIn(['data', 'shortcode']).shortcodeId;
  }
  return null;
}

const shortcodeStyles = {border: '2px solid black', padding: '8px', margin: '2px 0', cursor: 'pointer'};

const NODE_COMPONENTS = {
  ...BLOCK_COMPONENTS,
  'link': props => {
    const data = props.node.get('data');
    const href = data.get('url');
    const title = data.get('title');
    return <a href={href} title={title} {...props.attributes}>{props.children}</a>;
  },
  'shortcode': props => {
    const { attributes, node, state: editorState } = props;
    const { data } = node;
    const isSelected = editorState.selection.hasFocusIn(node);
    return (
      <div
        className={cn(styles.shortcode, { [styles.shortcodeSelected]: isSelected })}
        {...attributes}
        draggable
      >
        {data.get('shortcode')}
      </div>
    );
  },
};

const MARK_COMPONENTS = {
  bold: props => <strong>{props.children}</strong>,
  italic: props => <em>{props.children}</em>,
  strikethrough: props => <s>{props.children}</s>,
  code: props => <code>{props.children}</code>,
};

const SoftBreak = (options = {}) => ({
  onKeyDown(e, data, state) {
    if (data.key != 'enter') return;
    if (options.shift && e.shiftKey == false) return;

    const { onlyIn, ignoreIn, closeAfter, unwrapBlocks, defaultBlock = 'paragraph' } = options;
    const { type, nodes } = state.startBlock;
    if (onlyIn && !onlyIn.includes(type)) return;
    if (ignoreIn && ignoreIn.includes(type)) return;

    const shouldClose = nodes.last().characters.takeLast(closeAfter).every(c => c.text === '\n');
    if (closeAfter && shouldClose) {
      const trimmed = state.transform().deleteBackward(closeAfter);
      const unwrapped = unwrapBlocks
        ? unwrapBlocks.reduce((acc, blockType) => acc.unwrapBlock(blockType), trimmed)
        : trimmed;
      return unwrapped.insertBlock(defaultBlock).apply();
    }

    return state.transform().insertText('\n').apply();
  }
});

const BackspaceCloseBlock = (options = {}) => ({
  onKeyDown(e, data, state) {
    if (data.key != 'backspace') return;

    const { defaultBlock = 'paragraph', ignoreIn, onlyIn } = options;
    const { startBlock } = state;
    const { type } = startBlock;

    if (onlyIn && !onlyIn.includes(type)) return;
    if (ignoreIn && ignoreIn.includes(type)) return;

    const characters = startBlock.getFirstText().characters;
    const isEmpty = !characters || characters.isEmpty();

    if (isEmpty) {
      return state.transform().insertBlock(defaultBlock).focus().apply();
    }
  }
});

const EditListPlugin = EditList({ types: ['bulleted-list', 'numbered-list'], typeItem: 'list-item' });

const slatePlugins = [
  SoftBreak({ ignoreIn: ['paragraph', 'list-item', 'numbered-list', 'bulleted-list', 'table', 'table-row', 'table-cell'], closeAfter: 1 }),
  BackspaceCloseBlock({ ignoreIn: ['paragraph', 'list-item', 'bulleted-list', 'numbered-list', 'table', 'table-row', 'table-cell'] }),
  EditListPlugin,
  EditTable({ typeTable: 'table', typeRow: 'table-row', typeCell: 'table-cell' }),
];

export default class Editor extends Component {
  constructor(props) {
    super(props);
    const plugins = registry.getEditorComponents();
    const emptyRaw = {
      nodes: [{ kind: 'block', type: 'paragraph', nodes: [
        { kind: 'text', ranges: [{ text: '' }] }
      ]}],
    };
    const remark = this.props.value && remarkToSlate(this.props.value);
    const initialValue = get(remark, ['nodes', 'length']) ? remark : emptyRaw;
    const editorState = SlateRaw.deserialize(initialValue, { terse: true });
    this.state = {
      editorState,
      schema: {
        nodes: NODE_COMPONENTS,
        marks: MARK_COMPONENTS,
        rules: [
          /**
           * If the editor is ever in an empty state, insert an empty
           * paragraph block.
           */
          {
            match: object => object.kind === 'document',
            validate: doc => {
              const hasBlocks = !doc.getBlocks().isEmpty();
              return hasBlocks ? null : {};
            },
            normalize: transform => {
              const block = SlateBlock.create({
                type: 'paragraph',
                nodes: [SlateText.createFromString('')],
              });
              const { key } = transform.state.document;
              return transform.insertNodeByKey(key, 0, block).focus();
            },
          },
        ],
      },
      plugins,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.editorState.equals(nextState.editorState)) {
      return false
    }
    return true;
  }

  handlePaste = (e, data, state) => {
    if (data.type !== 'html' || data.isShift) {
      return;
    }
    const ast = htmlToSlate(data.html);
    const { document: doc } = SlateRaw.deserialize(ast, { terse: true });
    return state.transform().insertFragment(doc).apply();
  }

  handleDocumentChange = (doc, editorState) => {
    const raw = SlateRaw.serialize(editorState, { terse: true });
    const mdast = slateToRemark(raw);
    this.props.onChange(mdast);
  };

  hasMark = type => this.state.editorState.marks.some(mark => mark.type === type);
  hasBlock = type => this.state.editorState.blocks.some(node => node.type === type);

  handleKeyDown = (e, data, state) => {
    const createDefaultBlock = () => {
      return SlateBlock.create({
        type: 'paragraph',
        nodes: [SlateText.createFromString('')]
      });
    };
    if (data.key === 'enter') {
      /**
       * If "Enter" is pressed while a single void block is selected, a new
       * paragraph should be added above or below it, and the current selection
       * should be collapsed to the start of the new paragraph.
       *
       * If the selected block is the first block in the document, create the
       * new block above it. If not, create the new block below it.
       */
      const { document: doc, selection, anchorBlock, focusBlock } = state;
      const singleBlockSelected = anchorBlock === focusBlock;
      if (!singleBlockSelected || !focusBlock.isVoid) return;

      e.preventDefault();

      const focusBlockParent = doc.getParent(focusBlock.key);
      const focusBlockIndex = focusBlockParent.nodes.indexOf(focusBlock);
      const focusBlockIsFirstChild = focusBlockIndex === 0;

      const newBlock = createDefaultBlock();
      const newBlockIndex = focusBlockIsFirstChild ? 0 : focusBlockIndex + 1;

      return state.transform()
        .insertNodeByKey(focusBlockParent.key, newBlockIndex, newBlock)
        .collapseToStartOf(newBlock)
        .apply();
    }

    if (data.isMod) {

      if (data.key === 'y') {
        e.preventDefault();
        return state.transform().redo().focus().apply({ save: false });
      }

      if (data.key === 'z') {
        e.preventDefault();
        return state.transform()[data.isShift ? 'redo' : 'undo']().focus().apply({ save: false });
      }

      const marks = {
        b: 'bold',
        i: 'italic',
        u: 'underlined',
        s: 'strikethrough',
        '`': 'code',
      };

      const mark = marks[data.key];

      if (mark) {
        e.preventDefault();
        return state.transform().toggleMark(mark).apply();
      }
    }
  };

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
      const transformed = transform.setBlock(isActive ? DEFAULT_NODE : type);
    }

    // Handle the extra wrapping required for list buttons.
    else {
      const isSameListType = editorState.blocks.some(block => {
        return !!doc.getClosest(block.key, parent => parent.type === type);
      });
      const isInList = EditListPlugin.utils.isSelectionInList(editorState);

      if (isInList && isSameListType) {
        EditListPlugin.transforms.unwrapList(transform, type);
      } else if (isInList) {
        const currentListType = type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list';
        EditListPlugin.transforms.unwrapList(transform, currentListType);
        EditListPlugin.transforms.wrapInList(transform, type);
      } else {
        EditListPlugin.transforms.wrapInList(transform, type);
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
      shortcodeValue: plugin.toBlock(shortcodeData.toJS()),
      shortcodeData,
    };
    const nodes = [SlateText.createFromString('')];
    const block = { kind: 'block', type: 'shortcode', data, isVoid: true, nodes };
    const resolvedState = editorState.transform().insertBlock(block).apply();
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
    const { plugins, selectionPosition, dragging } = this.state;

    return (
      <div className={styles.editor}>
        <Sticky
          className={styles.editorControlBar}
          classNameActive={styles.editorControlBarSticky}
          fillContainerWidth
        >
          <Toolbar
            selectionPosition={selectionPosition}
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
            }}
            onToggleMode={this.handleToggle}
            plugins={plugins}
            onSubmit={this.handlePluginSubmit}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
            getAsset={getAsset}
          />
        </Sticky>
        <SlateEditor
          className={styles.slateEditor}
          state={this.state.editorState}
          schema={this.state.schema}
          plugins={slatePlugins}
          onChange={editorState => this.setState({ editorState })}
          onDocumentChange={this.handleDocumentChange}
          onKeyDown={this.handleKeyDown}
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
  value: PropTypes.object,
};
