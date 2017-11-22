import PropTypes from 'prop-types';
import React from 'react';
import 'redux-notifications/lib/styles.css'; // Import default redux-notifications styles into global scope.

const themeClasses = `nc-theme-base nc-theme-container nc-theme-rounded nc-theme-depth`;

export default function Toast({ kind, message }) {
  return (
    <div className={`${ themeClasses } nc-toast-root nc-toast-${ kind }`}>
      {message}
    </div>
  );
}

Toast.propTypes = {
  kind: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.string,
};
