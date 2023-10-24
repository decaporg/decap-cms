import React from 'react';
import PropTypes from 'prop-types';
import Transition from 'react-transition-group/Transition';

class Slide extends React.Component {
  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  handleEnter = node => {
    if (this.props.onEnter) this.props.onEnter(node);
  };

  handleExit = node => {
    if (this.props.onExit) this.props.onExit(node);
  };

  styles = {
    default: {
      transform: `translateY(${(() => {
        if (this.props.direction === 'down') return `-100%`;
        if (this.props.direction === 'up') return `100%`;
        return 0;
      })()}) translateX(${(() => {
        if (this.props.direction === 'right') return `-100%`;
        if (this.props.direction === 'left') return `100%`;
        return 0;
      })()})`,
      transition: `transform 250ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    entering: { transform: `translateX(0) translateY(0)` },
    entered: { transform: `translateX(0) translateY(0)` },
    exiting: {
      transform: `translateY(${(() => {
        if (this.props.direction === 'down') return `-100%`;
        if (this.props.direction === 'up') return `100%`;
        return 0;
      })()}) translateX(${(() => {
        if (this.props.direction === 'right') return `-100%`;
        if (this.props.direction === 'left') return `100%`;
        return 0;
      })()})`,
    },
    exited: {
      transform: `translateY(${(() => {
        if (this.props.direction === 'down') return `-100%`;
        if (this.props.direction === 'up') return `100%`;
        return 0;
      })()}) translateX(${(() => {
        if (this.props.direction === 'right') return `-100%`;
        if (this.props.direction === 'left') return `100%`;
        return 0;
      })()})`,
    },
  };

  render() {
    const { children, style: styleProp, timeout, direction, ...other } = this.props;
    const style = {
      ...styleProp,
      ...this.styles.default,
      ...(React.isValidElement(children) ? children.props.style : {}),
    };

    console.log({ direction, styles: this.styles });

    return (
      <Transition
        appear
        onEnter={this.handleEnter}
        onExit={this.handleExit}
        timeout={timeout === 'auto' ? null : timeout}
        {...other}
      >
        {(state, childProps) =>
          React.cloneElement(children, {
            style: { ...style, ...this.styles[state] },
            ...childProps,
          })
        }
      </Transition>
    );
  }
}

Slide.propTypes = {
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

Slide.defaultProps = { timeout: 250, direction: 'down' };

export default Slide;
