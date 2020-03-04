import React from 'react';
import PropTypes from 'prop-types';
import Transition from 'react-transition-group/Transition';
import { duration } from '../utils/transitions';

const styles = {
  default: {
    opacity: 0,
    willChange: 'opacity',
    transition: 'opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
  },
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
};

class Fade extends React.Component {
  handleEnter = node => {
    if (this.props.onEnter) this.props.onEnter(node);
  };

  handleExit = node => {
    if (this.props.onExit) this.props.onExit(node);
  };

  render() {
    const { children, style: styleProp, ...other } = this.props;
    const style = {
      ...styles.default,
      ...styleProp,
      ...(React.isValidElement(children) ? children.props.style : {}),
    };

    return (
      <Transition appear onEnter={this.handleEnter} onExit={this.handleExit} {...other}>
        {(state, childProps) =>
          React.cloneElement(children, {
            style: { ...style, ...styles[state] },
            ...childProps,
          })
        }
      </Transition>
    );
  }
}

Fade.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  in: PropTypes.bool,
  onEnter: PropTypes.func,
  onExit: PropTypes.func,
  style: PropTypes.object,
  theme: PropTypes.object,
  timeout: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ enter: PropTypes.number, exit: PropTypes.number }),
  ]),
};

Fade.defaultProps = {
  timeout: {
    enter: duration.enteringScreen,
    exit: duration.leavingScreen,
  },
};

export default Fade;
