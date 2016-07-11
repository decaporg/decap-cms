import React from 'react';
import styles from './Card.css';

export default function Card({ style, className = '', children }) {
  return <div className={`${styles.card} ${className}`} style={style}>{children}</div>;
}
