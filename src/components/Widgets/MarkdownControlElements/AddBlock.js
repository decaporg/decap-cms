import React from 'react';
import { Icon } from '../../UI';
import styles from './AddBlock.css';

export default function AddBlock({top, left}) {
  const style = {
    top,
    left
  }
  return (
    <Icon type="plus-squared" className={styles.root} style={style} />
  );
}
