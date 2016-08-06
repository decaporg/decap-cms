import React, { PropTypes } from 'react';
import { Editor, Plain } from 'slate';
import position from 'selection-position';
import Markdown from 'slate-markdown-serializer';
import { DEFAULT_NODE, NODES, MARKS } from './MarkdownControlElements/localRenderers';
import StylesMenu from './MarkdownControlElements/StylesMenu';
import BlockTypesMenu from './MarkdownControlElements/BlockTypesMenu';

const markdown = new Markdown();

/**
 * Slate Render Configuration
 */
class MarkdownControl extends React.Component {
  constructor(props) {
    super(props);
    this.blockEdit = false;
    this.menuPositions = {
      stylesMenu: {
        top: 0,
        left: 0,
        width: 0,
        height: 0
      },
      blockTypesMenu: {
        top: 0,
        left: 0,
        width: 0,
        height: 0
      }
    };

    this.state = {
      state: props.value ? markdown.deserialize(props.value) : Plain.deserialize('')
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleDocumentChange = this.handleDocumentChange.bind(this);
    this.handleMarkStyleClick = this.handleMarkStyleClick.bind(this);
    this.handleBlockStyleClick = this.handleBlockStyleClick.bind(this);
    this.handleInlineClick = this.handleInlineClick.bind(this);
    this.handleBlockTypeClick = this.handleBlockTypeClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.calculateMenuPositions = this.calculateMenuPositions.bind(this);
    this.renderBlockTypesMenu = this.renderBlockTypesMenu.bind(this);
    this.renderNode = this.renderNode.bind(this);
    this.renderMark = this.renderMark.bind(this);
  }

  /**
   * Slate keeps track of selections, scroll position etc.
   * So, onChange gets dispatched on every interaction (click, arrows, everything...)
   * It also have an onDocumentChange, that get's dispached only when the actual
   * content changes
   */
  handleChange(state) {
    if (this.blockEdit) {
      this.blockEdit = false;
    } else {
      this.setState({ state }, this.calculateMenuPositions);
    }
  }

  handleDocumentChange(document, state) {
    this.props.onChange(markdown.serialize(state));
  }

  /**
   * All menu positions are calculated accessing dom elements
   * That's why calculateMenuPositions is called on handleChange's setState callback
   */
  calculateMenuPositions() {
    const rect1 = position();
    this.menuPositions.stylesMenu = {
      top: rect1.top + window.scrollY,
      left: rect1.left + window.scrollX,
      width: rect1.width,
      height: rect1.height
    };

    const blockElement = document.querySelectorAll(`[data-key='${this.state.state.selection.focusKey}']`);
    if (blockElement.length > 0) {
      const rect2 = blockElement[0].getBoundingClientRect();
      this.menuPositions.blockTypesMenu = {
        top: rect2.top + window.scrollY,
        left: rect2.left + window.scrollX
      };
      this.forceUpdate();
    }

  }

  /**
   * Toggle marks / blocks when button is clicked
   */
  handleMarkStyleClick(type) {
    let { state } = this.state;

    state = state
      .transform()
      .toggleMark(type)
      .apply();

    this.setState({ state });
  }

  handleBlockStyleClick(type, isActive, isList) {
    let { state } = this.state;
    let transform = state.transform();
    const { document } = state;

    // Handle everything but list buttons.
    if (type != 'bulleted-list' && type != 'numbered-list') {

      if (isList) {
        transform = transform
          .setBlock(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      }

      else {
        transform = transform
          .setBlock(isActive ? DEFAULT_NODE : type);
      }
    }

    // Handle the extra wrapping required for list buttons.
    else {
      const isType = state.blocks.some((block) => {
        return !!document.getClosest(block, parent => parent.type == type);
      });

      if (isList && isType) {
        transform = transform
          .setBlock(DEFAULT_NODE)
          .unwrapBlock('bulleted-list');
      } else if (isList) {
        transform = transform
          .unwrapBlock(type == 'bulleted-list')
          .wrapBlock(type);
      } else {
        transform = transform
          .setBlock('list-item')
          .wrapBlock(type);
      }
    }

    state = transform.apply();
    this.setState({ state });
  }

  /**
 * When clicking a link, if the selection has a link in it, remove the link.
 * Otherwise, add a new link with an href and text.
 *
 * @param {Event} e
 */

  handleInlineClick(type, isActive) {
    let { state } = this.state;

    if (type === 'link') {
      if (!state.isExpanded) return;

      if (isActive) {
        state = state
          .transform()
          .unwrapInline('link')
          .apply();
      }

      else {
        const href = window.prompt('Enter the URL of the link:', 'http://www.');
        state = state
          .transform()
          .wrapInline({
            type: 'link',
            data: { href }
          })
          .collapseToEnd()
          .apply();
      }
    }
    this.setState({ state });
  }


  handleBlockTypeClick(type) {
    let { state } = this.state;

    state = state
    .transform()
    .insertBlock(type)
    .apply();

    this.setState({ state }, () => {
      const blocks = this.state.state.document.getBlocks();
      const last = blocks.last();
      const normalized = state
        .transform()
        .focus()
        .collapseToEndOf(last)
        .splitBlock()
        .setBlock(DEFAULT_NODE)
        .apply({
          snapshot: false
        });
      this.setState({ state:normalized });
    });
  }

  handleKeyDown(evt) {
    if (evt.shiftKey && evt.key === 'Enter') {
      this.blockEdit = true;
      let { state } = this.state;
      state = state
      .transform()
      .insertText('  \n')
      .apply();

      this.setState({ state });
    }
  }

  /**
   * Return renderers for Slate
   */
  renderNode(node) {
    return NODES[node.type];
  }
  renderMark(mark) {
    return MARKS[mark.type];
  }

  renderBlockTypesMenu() {
    const currentBlock = this.state.state.blocks.get(0);
    const isOpen = (currentBlock.isEmpty && currentBlock.type !== 'list-item' && currentBlock.type !== 'horizontal-rule');

    return (
      <BlockTypesMenu
          isOpen={isOpen}
          position={this.menuPositions.blockTypesMenu}
          onClickBlock={this.handleBlockTypeClick}
      />
    );
  }

  renderStylesMenu() {
    const { state } = this.state;
    const isOpen = !(state.isBlurred || state.isCollapsed);

    return (
      <StylesMenu
          isOpen={isOpen}
          position={this.menuPositions.stylesMenu}
          marks={this.state.state.marks}
          blocks={this.state.state.blocks}
          inlines={this.state.state.inlines}
          onClickMark={this.handleMarkStyleClick}
          onClickInline={this.handleInlineClick}
          onClickBlock={this.handleBlockStyleClick}
      />
    );
  }

  render() {
    return (
      <div>
        {this.renderStylesMenu()}
        {this.renderBlockTypesMenu()}
        <Editor
            placeholder={'Enter some rich text...'}
            state={this.state.state}
            renderNode={this.renderNode}
            renderMark={this.renderMark}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            onDocumentChange={this.handleDocumentChange}
        />
      </div>
    );
  }
}

export default MarkdownControl;

MarkdownControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
};
