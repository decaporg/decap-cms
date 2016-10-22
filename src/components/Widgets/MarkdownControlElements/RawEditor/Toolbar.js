import React from 'react';
import styles from './Toolbar.css';

function button(label, action) {
  return (<li className={styles.Button}>
    <button className={styles[label]} onClick={action}>{label}</button>
  </li>);
}

export default class Toolbar extends React.Component {
  render() {
    const { isOpen, onBold, onItalic, onLink } = this.props;
    const classNames = [styles.Toolbar];
    if (isOpen) {
      classNames.push(styles.Visible);
    }
    return (
      <ul className={classNames.join(' ')}>
        {button('Bold', onBold)}
        {button('Italic', onItalic)}
        {button('Link', onLink)}
      </ul>
    );
  }
}
