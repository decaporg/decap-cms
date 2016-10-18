import React, { PropTypes } from 'react';
import { Icon } from '../index';
import styles from './Toast.css';

const icons = {
  info: 'info',
  success: 'check',
  warning: 'attention',
  danger: 'alert',
};

export default function Toast({ kind, message }) {
  return (
    <div className={styles[kind]}>
      <Icon type={icons[kind]} className={styles.icon} />
      {message}
    </div>
  );
}

Toast.propTypes = {
  kind: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.string,
};
