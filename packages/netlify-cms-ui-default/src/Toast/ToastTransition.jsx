import React from 'react';
import PropTypes from 'prop-types';
import Transition from 'react-transition-group/Transition';

class ToastTransition extends React.Component {
  state = {
    elHeight: null,
  };

  componentDidMount() {
    if (this.props.el) this.setElHeight(this.props.el);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.el && this.props.el) this.setElHeight(this.props.el);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  handleEnter = node => {
    if (this.props.onEnter) this.props.onEnter(node);
  };

  handleExit = node => {
    if (this.props.onExit) this.props.onExit(node);
  };

  elHeight = null;

  setElHeight = el =>
    this.setState(
      { elDimensions: el.getBoundingClientRect() },
      () => (this.elHeight = el.getBoundingClientRect().height),
    );

  render() {
    const { children, style: styleProp, timeout, ...other } = this.props;
    const styles = {
      default: {
        height: 0,
        paddingBottom: 0,
        transform: `translateX(0) translateY(24px)`,
      },
      entering: {
        height: 0,
        paddingBottom: 0,
        transform: `translateX(0) translateY(24px)`,
      },
      entered: {
        height: this.props.el && this.props.el.offsetHeight,
        paddingBottom: 8,
        transform: `translateX(0) translateY(0)`,
        transition: `transform 200ms cubic-bezier(0.4, 0, 0.2, 1), height 200ms cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms`,
      },
      exiting: {
        transform: `translateY(-${this.props.el &&
          this.props.el.offsetHeight}px) translateX(${(() => {
          if (this.props.direction === 'right') return `-100%`;
          if (this.props.direction === 'left') return `100%`;
          return 0;
        })()})`,
        height: 0,
        paddingBottom: 0,
        zIndex: 0,
        opacity: 0,
        transition: `transform 200ms cubic-bezier(0.4, 0, 0.2, 1), height 200ms cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms`,
      },
      exited: {
        transform: `translateY(-${this.props.el &&
          this.props.el.offsetHeight + 8}px) translateX(${(() => {
          if (this.props.direction === 'right') return `-100%`;
          if (this.props.direction === 'left') return `100%`;
          return 0;
        })()})`,
        height: 0,
        paddingBottom: 0,
        zIndex: 0,
        opacity: 0,
      },
    };

    const style = {
      ...styleProp,
      ...styles.default,
      ...(React.isValidElement(children) ? children.props.style : {}),
    };

    return (
      <Transition
        appear
        onEnter={this.handleEnter}
        onExit={this.handleExit}
        timeout={timeout === 'auto' ? null : timeout}
        {...other}
      >
        {(state, childProps) => {
          return React.cloneElement(children, {
            style: { ...style, ...styles[state] },
            ...childProps,
          });
        }}
      </Transition>
    );
  }
}

ToastTransition.propTypes = {
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

ToastTransition.defaultProps = { timeout: 200, direction: 'down' };

export default ToastTransition;
