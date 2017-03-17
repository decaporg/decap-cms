import React, { PropTypes } from 'react';
import { Icon } from '../../UI';
import styles from './Toolbar.css';

function button(label, icon, action) {
  return (<li className={styles.Button}>
    <button className={styles[label]} onClick={action} title={label}>
      <Icon type={icon} />
    </button>
  </li>);
}

function Toolbar(props) {
  const { onH1, onH2, onBold, onItalic, onLink, onToggleMode } = props;
  return (
    <ul className={styles.Toolbar}>
      {button('Header 1', 'h1', onH1)}
      {button('Header 2', 'h2', onH2)}
      {button('Bold', 'bold', onBold)}
      {button('Italic', 'italic', onItalic)}
      {button('Link', 'link', onLink)}
      {button('View Code', 'code', onToggleMode)}
    </ul>
  );
}

Toolbar.propTypes = {
  onH1: PropTypes.func.isRequired,
  onH2: PropTypes.func.isRequired,
  onBold: PropTypes.func.isRequired,
  onItalic: PropTypes.func.isRequired,
  onLink: PropTypes.func.isRequired,
  onToggleMode: PropTypes.func.isRequired,
};

export default Toolbar;
