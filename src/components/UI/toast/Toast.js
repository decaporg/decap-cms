import PropTypes from 'prop-types';
import React from 'react';
import { Icon } from '../index';
import 'redux-notifications/lib/styles.css'; // Import default redux-notifications styles into global scope.

const themeClasses = `nc-theme-base nc-theme-container nc-theme-rounded nc-theme-depth`;

const icons = {
  info: 'info',
  success: 'check',
  warning: 'attention',
  danger: 'alert',
};

export default function Toast({ kind, message }) {
  return (
    <div className={`${ themeClasses } nc-toast-root nc-toast-${ kind }`}>
      <Icon type={icons[kind]} className="nc-toast-icon" />
      {message}
    </div>
  );
}

Toast.propTypes = {
  kind: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.string,
};
