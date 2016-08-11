import React, { PropTypes } from 'react';
import styles from './Block.css';

const AVAILABLE_TYPES = [
  'Paragraph',
  'Heading1',
  'Heading2',
  'Heading3',
  'Heading4',
  'Heading5',
  'Heading6',
  'List',
  'blockquote'
];

export function Block({ type, children }) {
  return (
    <div className={styles.root}>
      <div contentEditable={false} className={styles.type} data-type={type}/>
      <div className={`${styles.body} ${styles[type]}`}>
        {children}
      </div>
    </div>
  );
}

Block.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(AVAILABLE_TYPES).isRequired
};

export default Block;
