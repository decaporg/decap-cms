import React from 'react';
import styles from './Card.css'


export default function Card({style, children}) {
  return <div className={styles.card} style={style}>{children}</div>
}
