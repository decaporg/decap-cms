import React, { Component, PropTypes } from 'react';
import Portal from 'react-portal';
import { Icon } from '../../../UI';
import styles from './StylesMenu.css';

export default class StylesMenu extends Component {

  constructor(props) {
    super(props);

    this.state = {
      menu: null
    };

    this.hasMark = this.hasMark.bind(this);
    this.hasBlock = this.hasBlock.bind(this);
    this.renderMarkButton = this.renderMarkButton.bind(this);
    this.renderBlockButton = this.renderBlockButton.bind(this);
    this.renderLinkButton = this.renderLinkButton.bind(this);
    this.updateMenuPosition = this.updateMenuPosition.bind(this);
    this.handleMarkClick = this.handleMarkClick.bind(this);
    this.handleInlineClick = this.handleInlineClick.bind(this);
    this.handleBlockClick = this.handleBlockClick.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
  }

  /**
   * On update, update the menu.
   */
  componentDidMount() {
    this.updateMenuPosition();
  }

  componentDidUpdate() {
    this.updateMenuPosition();
  }

  updateMenuPosition() {
    const { menu } = this.state;
    const { position } = this.props;
    if (!menu) return;

    menu.style.opacity = 1;
    menu.style.top = `${position.top - menu.offsetHeight}px`;
    menu.style.left = `${position.left - menu.offsetWidth / 2 + position.width / 2}px`;
  }

  /**
   * Used to set toolbar buttons to active state
   */
  hasMark(type) {
    const { marks } = this.props;
    return marks.some(mark => mark.type == type);
  }
  hasBlock(type) {
    const { blocks } = this.props;
    return blocks.some(node => node.type == type);
  }
  hasLinks(type) {
    const { inlines } = this.props;
    return inlines.some(inline => inline.type == 'link');
  }

  handleMarkClick(e, type) {
    e.preventDefault();
    this.props.onClickMark(type);
  }

  renderMarkButton(type, icon) {
    const isActive = this.hasMark(type);
    const onMouseDown = e => this.handleMarkClick(e, type);
    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        <Icon type={icon}/>
      </span>
    );
  }

  handleInlineClick(e, type, isActive) {
    e.preventDefault();
    this.props.onClickInline(type, isActive);
  }

  renderLinkButton() {
    const isActive = this.hasLinks();
    const onMouseDown = e => this.handleInlineClick(e, 'link', isActive);
    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        <Icon type="link"/>
      </span>
    );
  }

  handleBlockClick(e, type) {
    e.preventDefault();
    const isActive = this.hasBlock(type);
    const isList = this.hasBlock('list-item');
    this.props.onClickBlock(type, isActive, isList);
  }

  renderBlockButton(type, icon, checkType) {
    checkType = checkType || type;
    const isActive = this.hasBlock(checkType);
    const onMouseDown = e => this.handleBlockClick(e, type);
    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        <Icon type={icon}/>
      </span>
    );
  }

  /**
   * When the portal opens, cache the menu element.
   */
  handleOpen(portal) {
    this.setState({ menu: portal.firstChild });
  }

  render() {
    const { isOpen } = this.props;
    return (
      <Portal isOpened={isOpen} onOpen={this.handleOpen}>
        <div className={`${styles.menu} ${styles.hoverMenu}`}>
          {this.renderMarkButton('BOLD', 'bold')}
          {this.renderMarkButton('ITALIC', 'italic')}
          {this.renderMarkButton('CODE', 'code')}
          {this.renderLinkButton()}
          {this.renderBlockButton('header_one', 'h1')}
          {this.renderBlockButton('header_two', 'h2')}
          {this.renderBlockButton('blockquote', 'quote-left')}
          {this.renderBlockButton('unordered_list', 'list-bullet', 'list_item')}
        </div>
      </Portal>
    );
  }

}

StylesMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired
  }),
  marks: PropTypes.object.isRequired,
  blocks: PropTypes.object.isRequired,
  inlines: PropTypes.object.isRequired,
  onClickBlock: PropTypes.func.isRequired,
  onClickMark: PropTypes.func.isRequired,
  onClickInline: PropTypes.func.isRequired
};
