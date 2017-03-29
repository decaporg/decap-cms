import React, { PropTypes } from 'react';
import { List } from 'immutable';
import { Icon } from '../../UI';
import styles from './Toolbar.css';

function button(label, icon, action, active) {
  const classNames = List([styles.Button]);
  return (<li className={(active ? classNames.push(styles.ButtonActive) : classNames).join(' ')}>
    <button className={styles[label]} onClick={action} title={label}>
      { icon ? <Icon type={icon} /> : 'Toggle Markdown' }
    </button>
  </li>);
}

function toggle(...args) {
  return <div className={styles.Toggle}>{button(...args)}</div>;
}

function Toolbar(props) {
  const { onH1, onH2, onBold, onItalic, onLink, onToggleMode, rawMode } = props;
  return (
    <ul className={styles.Toolbar}>
      {button('Header 1', 'h1', onH1)}
      {button('Header 2', 'h2', onH2)}
      {button('Bold', 'bold', onBold)}
      {button('Italic', 'italic', onItalic)}
      {button('Link', 'link', onLink)}
      {toggle('View Code', null, onToggleMode, rawMode)}
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
  rawMode: PropTypes.bool,
};

export default Toolbar;
