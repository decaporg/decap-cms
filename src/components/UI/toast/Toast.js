import PropTypes from 'prop-types';
import React from 'react';
import 'redux-notifications/lib/styles.css'; // Import default redux-notifications styles into global scope.

export const Toast = ({ kind, message }) =>
  <div className={`nc-toast nc-toast-${ kind }`}>
    {message}
  </div>;

Toast.propTypes = {
  kind: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.string,
};
