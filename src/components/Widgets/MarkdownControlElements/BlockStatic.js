import React, { PropTypes } from 'react';
import styles from './BlockStatic.css';

const AVAILABLE_TYPES = [
  'divider'
];

export function BlockStatic({ type, children }) {
  return (
    <div className={`${styles[type]}`} contentEditable={false}>{children}</div>
  );
}

BlockStatic.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(AVAILABLE_TYPES).isRequired
};

export default BlockStatic;
