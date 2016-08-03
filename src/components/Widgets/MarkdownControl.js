import React, { PropTypes } from 'react';
import { Editor, Plain } from 'slate';
import Markdown from 'slate-markdown-serializer';
import Block from './MarkdownControlElements/Block';
import Portal from 'react-portal';
import position from 'selection-position';
import { Icon } from '../UI';
import styles from './MarkdownControl.css';

const markdown = new Markdown();
/*
 * Slate Render Configuration
 */

// Define the default node type.
const DEFAULT_NODE = 'paragraph';

// Local node renderers.
const NODES = {
  'block-quote': (props) => <Block type='blockquote' {...props.attributes}>{props.children}</Block>,
  'bulleted-list': props => <Block type='Unordered List'><ul {...props.attributes}>{props.children}</ul></Block>,
  'heading1': props => <Block type='Heading1' {...props.attributes}>{props.children}</Block>,
  'heading2': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading3': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading4': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading5': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading6': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'list-item': props => <li {...props.attributes}>{props.children}</li>,
  'paragraph': props => <Block type='Paragraph' {...props.attributes}>{props.children}</Block>,
  'link': (props) => {
    const { data } = props.node;
    const href = data.get('href');
    return <span><a {...props.attributes} href={href}>{props.children}</a><Icon type="link"/></span>;
  },
  'image': (props) => {
    const { node, state } = props;
    const src = node.data.get('src');
    return (
      <img {...props.attributes} src={src} />
    );
  }
};

// Local mark renderers.
const MARKS = {
  bold: {
    fontWeight: 'bold'
  },
  italic: {
    fontStyle: 'italic'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: '3px',
    borderRadius: '4px'
  }
};

class MarkdownControl extends React.Component {
  constructor(props) {
    super(props);
    this.blockEdit = false;
    this.state = {
      state: props.value ? markdown.deserialize(props.value) : Plain.deserialize('')
    };

    this.hasMark = this.hasMark.bind(this);
    this.hasBlock = this.hasBlock.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleDocumentChange = this.handleDocumentChange.bind(this);
    this.onClickMark = this.onClickMark.bind(this);
    this.onClickBlock = this.onClickBlock.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.renderMenu = this.renderMenu.bind(this);
    this.renderMarkButton = this.renderMarkButton.bind(this);
    this.renderBlockButton = this.renderBlockButton.bind(this);
    this.renderNode = this.renderNode.bind(this);
    this.renderMark = this.renderMark.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.updateMenu = this.updateMenu.bind(this);
  }

  /*
   * On update, update the menu.
   */
  componentDidMount() {
    this.updateMenu();
  }
  componentDidUpdate() {
    this.updateMenu();
  }


  /*
   * Used to set toolbar buttons to active state
   */
  hasMark(type) {
    const { state } = this.state;
    return state.marks.some(mark => mark.type == type);
  }
  hasBlock(type) {
    const { state } = this.state;
    return state.blocks.some(node => node.type == type);
  }

  /*
   * Slate keeps track of selections, scroll position etc.
   * So, onChange gets dispatched on every interaction (click, arrows, everything...)
   * It also have an onDocumentChange, that get's dispached only when the actual
   * content changes
   */
  handleChange(state) {
    if (this.blockEdit) {
      this.blockEdit = false;
    } else {
      this.setState({ state });
    }
  }

  handleDocumentChange(document, state) {
    this.props.onChange(markdown.serialize(state));
  }


  /*
   * Toggle marks / blocks when button is clicked
   */
  onClickMark(e, type) {
    let { state } = this.state;

    state = state
      .transform()
      .toggleMark(type)
      .apply();

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

  onClickBlock(e, type) {
    e.preventDefault();
    let { state } = this.state;
    let transform = state.transform();
    const { document } = state;

    // Handle everything but list buttons.
    if (type != 'bulleted-list' && type != 'numbered-list') {
      const isActive = this.hasBlock(type);
      const isList = this.hasBlock('list-item');

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
      const isList = this.hasBlock('list-item');
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

  /*
   * When the portal opens, cache the menu element.
   */
  onOpen(portal) {
    this.setState({ menu: portal.firstChild });
  }

  renderMenu() {
    const { state } = this.state
    const isOpen = state.isExpanded && state.isFocused
    return (
      <Portal isOpened onOpen={this.onOpen}>
        <div className={`${styles.menu} ${styles.hoverMenu}`}>
          {this.renderMarkButton('bold', 'b')}
          {this.renderMarkButton('italic', 'i')}
          {this.renderMarkButton('underlined', 'u')}
          {this.renderMarkButton('code', 'code')}
          {this.renderBlockButton('heading1', 'h1')}
          {this.renderBlockButton('heading2', 'h2')}
          {this.renderBlockButton('block-quote', 'blockquote')}
          {this.renderBlockButton('bulleted-list', 'ul')}
        </div>
      </Portal>
    )
  }

  renderMarkButton(type, icon) {
    const isActive = this.hasMark(type);
    const onMouseDown = e => this.onClickMark(e, type);

    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        {icon}
      </span>
    );
  }

  renderBlockButton(type, icon) {
    const isActive = this.hasBlock(type);
    const onMouseDown = e => this.onClickBlock(e, type);

    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        <span>{icon}</span>
      </span>
    );
  }

  /*
   * Return renderers for Slate
   */
  renderNode(node) {
    return NODES[node.type];
  }
  renderMark(mark) {
    return MARKS[mark.type];
  }

  /*
   * Update the menu's absolute position.
   */

  updateMenu() {
    const { menu, state } = this.state;
    if (!menu) return;

    if (state.isBlurred || state.isCollapsed) {
      menu.removeAttribute('style');
      return;
    }

    const rect = position();
    menu.style.opacity = 1;
    menu.style.top = `${rect.top + window.scrollY - menu.offsetHeight}px`;
    menu.style.left = `${rect.left + window.scrollX - menu.offsetWidth / 2 + rect.width / 2}px`;
  }


  render() {
    return (
      <div>
        {this.renderMenu()}
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
