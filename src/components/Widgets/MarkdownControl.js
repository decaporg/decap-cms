import React, { PropTypes } from 'react';
import { Editor, Plain } from 'slate';
import position from 'selection-position';
import Markdown from 'slate-markdown-serializer';
import { DEFAULT_NODE, NODES, MARKS } from './MarkdownControlElements/localRenderers';
import StylesMenu from './MarkdownControlElements/StylesMenu';
import AddBlock from './MarkdownControlElements/AddBlock';

const markdown = new Markdown();

/**
 * Slate Render Configuration
 */
class MarkdownControl extends React.Component {
  constructor(props) {
    super(props);
    this.blockEdit = false;
    this.stylesMenuPosition = {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    };

    this.state = {
      state: props.value ? markdown.deserialize(props.value) : Plain.deserialize(''),
      addBlockButton:{
        show: false
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleDocumentChange = this.handleDocumentChange.bind(this);
    this.maybeShowBlockAddButton = this.maybeShowBlockAddButton.bind(this);
    this.handleMarkStyleClick = this.handleMarkStyleClick.bind(this);
    this.handleBlockStyleClick = this.handleBlockStyleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.renderAddBlock = this.renderAddBlock.bind(this);
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

      this.setState({ state }, this.maybeShowBlockAddButton);
    }
  }

  handleDocumentChange(document, state) {
    this.props.onChange(markdown.serialize(state));
  }

  maybeShowBlockAddButton() {
    if (this.state.state.blocks.get(0).isEmpty) {
      const rect = document.querySelectorAll(`[data-key='${this.state.state.selection.focusKey}']`)[0].getBoundingClientRect();
      this.setState({ addBlockButton: {
        show: true,
        top: rect.top + window.scrollY + 2,
        left: rect.left + window.scrollX - 28
      } });

    } else {
      this.setState({ addBlockButton: {
        show: false
      } });
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

  renderAddBlock() {
    return (
      this.state.addBlockButton.show ? <AddBlock top={this.state.addBlockButton.top} left={this.state.addBlockButton.left} /> : null
    );
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

  /**
   * Update the menu's absolute position.
   */
  renderStylesMenu() {
    const { state } = this.state;
    const rect = position();

    const isOpen = !(state.isBlurred || state.isCollapsed);

    if (isOpen) {
      this.stylesMenuPosition = {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      };
    }

    return (
      <StylesMenu
          isOpen={isOpen}
          position={this.stylesMenuPosition}
          marks={this.state.state.marks}
          blocks={this.state.state.blocks}
          onClickMark={this.handleMarkStyleClick}
          onClickBlock={this.handleBlockStyleClick}
      />
    );
  }

  render() {
    return (
      <div>
        {this.renderStylesMenu()}
        {this.renderAddBlock()}
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
