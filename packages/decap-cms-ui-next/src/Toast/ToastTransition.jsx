import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';

function ToastTransition({ children, ...props }) {
  console.log('ToastTransition', { props });

  return (
    <CSSTransition classNames="toast" timeout={200} {...props}>
      {children}
    </CSSTransition>
  );
}

ToastTransition.defaultProps = {
  children: null,
};

ToastTransition.propTypes = {
  children: PropTypes.node,
  done: PropTypes.func,
  isIn: PropTypes.bool,
  position: PropTypes.string,
  preventExitTransition: PropTypes.bool,
  enter: PropTypes.string,
  exit: PropTypes.string,
  append: PropTypes.bool,
  collapse: PropTypes.bool,
  collapseDuration: PropTypes.number,
};

export default ToastTransition;
