import React from 'react';
import styles from './Loader.css';

export default function Loader({ active, style, className = '', children }) {
  // Class names
  let classNames = styles.loader;
  if (active) {
    classNames += ` ${styles.active}`;
  }
  if (className.length > 0) {
    classNames += ` ${className}`;
  }

  // Render child text
  let child;
  if (children) {
    child = <div className={styles.text}>{children}</div>;
  }

  return <div className={classNames} style={style}>{child}</div>;
}
