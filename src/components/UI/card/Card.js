import React from 'react';
import styles from './Card.css';

export default function Card({ style, className = '', onClick, children }) {
  return <div className={`${styles.card} ${className}`} style={style} onClick={onClick}>{children}</div>;
}
