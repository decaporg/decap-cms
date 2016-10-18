import React, { Component, PropTypes } from 'react';
import withPortalAtCursorPosition from './withPortalAtCursorPosition';
import { Icon } from '../../../UI';
import styles from './StylesMenu.css';

class StylesMenu extends Component {

  static propTypes = {
    marks: PropTypes.object.isRequired,
    blocks: PropTypes.object.isRequired,
    inlines: PropTypes.object.isRequired,
    onClickBlock: PropTypes.func.isRequired,
    onClickMark: PropTypes.func.isRequired,
    onClickInline: PropTypes.func.isRequired,
  };

  /**
   * Used to set toolbar buttons to active state
   */
  hasMark = (type) => {
    const { marks } = this.props;
    return marks.some(mark => mark.type == type);
  };

  hasBlock = (type) => {
    const { blocks } = this.props;
    return blocks.some(node => node.type == type);
  };

  hasLinks = (type) => {
    const { inlines } = this.props;
    return inlines.some(inline => inline.type == 'link');
  };

  handleMarkClick = (e, type) => {
    e.preventDefault();
    this.props.onClickMark(type);
  };

  renderMarkButton = (type, icon) => {
    const isActive = this.hasMark(type);
    const onMouseDown = e => this.handleMarkClick(e, type);
    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        <Icon type={icon} />
      </span>
    );
  };

  handleInlineClick = (e, type, isActive) => {
    e.preventDefault();
    this.props.onClickInline(type, isActive);
  };

  renderLinkButton = () => {
    const isActive = this.hasLinks();
    const onMouseDown = e => this.handleInlineClick(e, 'link', isActive);
    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        <Icon type="link" />
      </span>
    );
  };

  handleBlockClick = (e, type) => {
    e.preventDefault();
    const isActive = this.hasBlock(type);
    const isList = this.hasBlock('list-item');
    this.props.onClickBlock(type, isActive, isList);
  };

  renderBlockButton = (type, icon, checkType) => {
    checkType = checkType || type;
    const isActive = this.hasBlock(checkType);
    const onMouseDown = e => this.handleBlockClick(e, type);
    return (
      <span className={styles.button} onMouseDown={onMouseDown} data-active={isActive}>
        <Icon type={icon} />
      </span>
    );
  };

  render() {
    return (
      <div className={`${ styles.menu } ${ styles.hoverMenu }`}>
        {this.renderMarkButton('BOLD', 'bold')}
        {this.renderMarkButton('ITALIC', 'italic')}
        {this.renderMarkButton('CODE', 'code')}
        {this.renderLinkButton()}
        {this.renderBlockButton('header_one', 'h1')}
        {this.renderBlockButton('header_two', 'h2')}
        {this.renderBlockButton('blockquote', 'quote-left')}
        {this.renderBlockButton('unordered_list', 'list-bullet', 'list_item')}
      </div>
    );
  }
}

export default withPortalAtCursorPosition(StylesMenu);
