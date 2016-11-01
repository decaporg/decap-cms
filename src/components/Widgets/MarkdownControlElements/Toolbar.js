import React, { Component, PropTypes } from 'react';
import { Icon } from '../../UI';
import styles from './Toolbar.css';

function button(label, icon, action) {
  return (<li className={styles.Button}>
    <button className={styles[label]} onClick={action} title={label}>
      <Icon type={icon} />
    </button>
  </li>);
}

export default class Toolbar extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    selectionPosition: PropTypes.object,
    onH1: PropTypes.func.isRequired,
    onH2: PropTypes.func.isRequired,
    onBold: PropTypes.func.isRequired,
    onItalic: PropTypes.func.isRequired,
    onLink: PropTypes.func.isRequired,
    onToggleMode: PropTypes.func.isRequired,
  };

  componentDidUpdate() {
    const { selectionPosition } = this.props;
    if (selectionPosition) {
      const rect = this.element.getBoundingClientRect();
      const parentRect = this.element.parentElement.getBoundingClientRect();
      const style = this.element.style;
      const pos = {
        top: selectionPosition.top - rect.height - 5,
        left: Math.min(selectionPosition.left, parentRect.width - rect.width),
      };
      style.setProperty('top', `${ pos.top }px`);
      style.setProperty('left', `${ pos.left }px`);
    }
  }

  handleRef = (ref) => {
    this.element = ref;
  };

  render() {
    const { isOpen, onH1, onH2, onBold, onItalic, onLink, onToggleMode } = this.props;
    const classNames = [styles.Toolbar];

    if (isOpen) {
      classNames.push(styles.Visible);
    }

    return (
      <ul className={classNames.join(' ')} ref={this.handleRef}>
        {button('Header 1', 'h1', onH1)}
        {button('Header 2', 'h2', onH2)}
        {button('Bold', 'bold', onBold)}
        {button('Italic', 'italic', onItalic)}
        {button('Link', 'link', onLink)}
        {button('View Code', 'code', onToggleMode)}
      </ul>
    );
  }
}
