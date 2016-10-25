import React, { Component, PropTypes } from 'react';
import { Icon } from '../../../UI';
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
    onBold: PropTypes.func.isRequired,
    onItalic: PropTypes.func.isRequired,
    onLink: PropTypes.func.isRequired,
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
    const { isOpen, onBold, onItalic, onLink } = this.props;
    const classNames = [styles.Toolbar];

    if (isOpen) {
      classNames.push(styles.Visible);
    }

    return (
      <ul className={classNames.join(' ')} ref={this.handleRef}>
        {button('Bold', 'bold', onBold)}
        {button('Italic', 'italic', onItalic)}
        {button('Link', 'link', onLink)}
      </ul>
    );
  }
}
