import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import warning from 'warning';
import debounce from 'debounce';
import EventListener from 'react-event-listener';
import ownerDocument from '../utils/ownerDocument';
import ownerWindow from '../utils/ownerWindow';
import Modal from '../Modal';
import Grow from '../transitions/Grow';
import Slide from '../transitions/Slide';
import { isWindowDown } from '../utils/responsive';

function getOffsetTop(rect, y) {
  let offset = 0;

  if (typeof y === 'number') {
    offset = y;
  } else if (y === 'center') {
    offset = rect.height / 2;
  } else if (y === 'bottom') {
    offset = rect.height;
  }

  return offset;
}

function getOffsetLeft(rect, x) {
  let offset = 0;

  if (typeof x === 'number') {
    offset = x;
  } else if (x === 'center') {
    offset = rect.width / 2;
  } else if (x === 'right') {
    offset = rect.width;
  }

  return offset;
}

function getTransformOriginValue(transformOrigin) {
  return [transformOrigin.x, transformOrigin.y]
    .map(n => (typeof n === 'number' ? `${n}px` : n))
    .join(' ');
}

function getScrollParent(parent, child) {
  let element = child;
  let scrollTop = 0;

  while (element && element !== parent) {
    element = element.parentNode;
    scrollTop += element.scrollTop;
  }
  return scrollTop;
}

function getAnchorEl(anchorEl) {
  return typeof anchorEl === 'function' ? anchorEl() : anchorEl;
}

const containerStyles = {
  position: 'absolute',
  maxWidth: 'calc(100% - 32px)',
  maxHeight: 'calc(100% - 32px)',
  outline: 'none',
};
const mobileContainerStyles = {
  position: 'absolute',
  maxWidth: '100%',
  maxHeight: '100%',
  outline: 'none',
  bottom: 0,
  width: '100%',
};

class Popover extends Component {
  handleGetOffsetTop = getOffsetTop;
  handleGetOffsetLeft = getOffsetLeft;

  state = { style: {} };

  constructor() {
    super();

    if (typeof window !== 'undefined') {
      this.handleResize = debounce(() => {
        this.setPositioningStyles(this.containerRef);
      }, 166); // Corresponds to 10 frames at 60 Hz.
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.anchorOrigin.x !== this.props.anchorOrigin.x ||
      prevProps.anchorOrigin.y !== this.props.anchorOrigin.y ||
      prevProps.transformOrigin.x !== this.props.transformOrigin.x ||
      prevProps.transformOrigin.y !== this.props.transformOrigin.y
    ) {
      this.handleResize();
    }
  }

  componentDidMount() {
    if (this.props.action) {
      this.props.action({
        updatePosition: this.handleResize,
      });
    }
  }

  componentWillUnmount() {
    this.handleResize.clear();
  }

  setPositioningStyles = element => {
    const newStyle = this.getPositioningStyle(element);

    if (newStyle.top) this.setState({ style: newStyle });
  };

  getPositioningStyle = element => {
    const { anchorEl, anchorReference, marginThreshold, supportsMobile } = this.props;
    const contentAnchorOffset = this.getContentAnchorOffset(element);
    const elemRect = {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
    const transformOrigin = this.getTransformOrigin(elemRect, contentAnchorOffset);
    const isMobile = isWindowDown('xs') && supportsMobile;

    if (anchorReference === 'none') {
      return {
        top: null,
        left: null,
        transformOrigin: getTransformOriginValue(transformOrigin),
      };
    }

    if (isMobile) {
      return {
        top: null,
        bottom: 0,
        left: 0,
        transformOrigin: getTransformOriginValue(transformOrigin),
      };
    }

    const anchorOffset = this.getAnchorOffset(contentAnchorOffset);
    let top = anchorOffset.top - transformOrigin.y;
    let left = anchorOffset.left - transformOrigin.x;
    const bottom = top + elemRect.height;
    const right = left + elemRect.width;
    const containerWindow = ownerWindow(getAnchorEl(anchorEl));
    const heightThreshold = containerWindow.innerHeight - marginThreshold;
    const widthThreshold = containerWindow.innerWidth - marginThreshold;

    if (top < marginThreshold) {
      const diff = top - marginThreshold;
      top -= diff;
      transformOrigin.y += diff;
    } else if (bottom > heightThreshold) {
      const diff = bottom - heightThreshold;
      top -= diff;
      transformOrigin.y += diff;
    }

    warning(
      element.height < heightThreshold || !element.height || !heightThreshold,
      [
        'The Popover component is too tall.',
        `Some part of it can not be seen on the screen (${(element.height = heightThreshold)}px).)`,
        'Please consider adding a `max-height` to improve the user-experience.',
      ].join('\n'),
    );

    if (left < marginThreshold) {
      const diff = left - marginThreshold;
      left -= diff;
      transformOrigin.x += diff;
    } else if (right > widthThreshold) {
      const diff = right - widthThreshold;
      left -= diff;
      transformOrigin.x += diff;
    }

    const elemStyles = {
      top: `${top}px`,
      left: `${left}px`,
      transformOrigin: getTransformOriginValue(transformOrigin),
    };

    return elemStyles;
  };

  getAnchorOffset(contentAnchorOffset) {
    const { anchorEl, anchorOrigin, anchorReference, anchorPosition } = this.props;

    if (anchorReference === 'anchorPosition') {
      warning(
        anchorPosition,
        'You need to provide a `anchorPosition` property when using <Popover anchorReference="anchorPosition" />',
      );
      return anchorPosition;
    }

    const anchorElement = getAnchorEl(anchorEl) || ownerDocument(this.containerRef).body;
    const anchorRect = anchorElement.getBoundingClientRect();
    const anchorY = contentAnchorOffset === 0 ? anchorOrigin.y : 'center';

    return {
      top: anchorRect.top + this.handleGetOffsetTop(anchorRect, anchorY),
      left: anchorRect.left + this.handleGetOffsetLeft(anchorRect, anchorOrigin.x),
    };
  }

  getContentAnchorOffset(element) {
    const { getContentAnchorEl, anchorReference } = this.props;
    let contentAnchorOffset = 0;

    if (getContentAnchorEl && anchorReference === 'anchorEl') {
      const contentAnchorEl = getContentAnchorEl(element);

      if (contentAnchorEl && element.contains(contentAnchorEl)) {
        const scrollTop = getScrollParent(element, contentAnchorEl);
        contentAnchorOffset =
          contentAnchorEl.offsetTop + contentAnchorEl.clientHeight / 2 - scrollTop || 0;
      }
    }

    return contentAnchorOffset;
  }

  getTransformOrigin(elemRect, contentAnchorOffset = 0) {
    const { transformOrigin, supportsMobile } = this.props;
    const isMobile = isWindowDown('xs') && supportsMobile;

    if (isMobile) {
      return { x: 'center', y: 'bottom' };
    }
    return {
      y: this.handleGetOffsetTop(elemRect, transformOrigin.y) + contentAnchorOffset,
      x: this.handleGetOffsetLeft(elemRect, transformOrigin.x),
    };
  }

  handleEntering = element => {
    if (this.props.onEntering) this.props.onEntering(element);
    this.setPositioningStyles(element);
  };

  render() {
    const {
      anchorEl,
      children,
      className,
      container: containerProp,
      modalClasses,
      onEnter,
      onEntered,
      onExit,
      onExited,
      onExiting,
      open,
      role,
      supportsMobile,
      TransitionComponent,
      transitionDuration: transitionDurationProp,
      TransitionProps,
      ...other
    } = this.props;

    const { style } = this.state;
    const transitionDuration = transitionDurationProp;
    const container =
      containerProp || (anchorEl ? ownerDocument(getAnchorEl(anchorEl)).body : undefined);
    const isMobile = isWindowDown('xs') && supportsMobile;
    const PopoverTransitionComponent = isMobile ? Slide : TransitionComponent;
    const PopoverTransitionProps = isMobile ? { direction: 'up' } : TransitionProps;

    return (
      <Modal
        classes={modalClasses}
        className={className}
        container={container}
        open={open}
        BackdropProps={{ invisible: !isMobile }}
        {...other}
      >
        <PopoverTransitionComponent
          appear
          in={open}
          onEnter={onEnter}
          onEntered={onEntered}
          onEntering={this.handleEntering}
          onExit={onExit}
          onExiting={onExiting}
          onExited={onExited}
          role={role}
          style={style}
          timeout={transitionDuration}
          {...PopoverTransitionProps}
        >
          <div
            style={isMobile ? mobileContainerStyles : containerStyles}
            ref={ref => {
              // eslint-disable-next-line react/no-find-dom-node
              this.containerRef = ReactDOM.findDOMNode(ref);
            }}
          >
            <EventListener target="window" onResize={this.handleResize} />
            {children}
          </div>
        </PopoverTransitionComponent>
      </Modal>
    );
  }
}

Popover.propTypes = {
  action: PropTypes.func,
  anchorEl: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  anchorOrigin: PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['left', 'center', 'right'])])
      .isRequired,
    y: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['top', 'center', 'bottom'])])
      .isRequired,
  }),
  anchorPosition: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
  }),
  anchorReference: PropTypes.oneOf(['anchorEl', 'anchorPosition', 'none']),
  children: PropTypes.node,
  container: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  elevation: PropTypes.number,
  getContentAnchorEl: PropTypes.func,
  marginThreshold: PropTypes.number,
  ModalClasses: PropTypes.object,
  onClose: PropTypes.func,
  onEnter: PropTypes.func,
  onEntered: PropTypes.func,
  onEntering: PropTypes.func,
  onExit: PropTypes.func,
  onExited: PropTypes.func,
  onExiting: PropTypes.func,
  open: PropTypes.bool.isRequired,
  PaperProps: PropTypes.object,
  role: PropTypes.string,
  transformOrigin: PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['left', 'center', 'right'])])
      .isRequired,
    y: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['top', 'center', 'bottom'])])
      .isRequired,
  }),
  TransitionComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  transitionDuration: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ enter: PropTypes.number, exit: PropTypes.number }),
    PropTypes.oneOf(['auto']),
  ]),
  TransitionProps: PropTypes.object,
};

Popover.defaultProps = {
  anchorReference: 'anchorEl',
  anchorOrigin: {
    y: 'top',
    x: 'left',
  },
  elevation: 8,
  marginThreshold: 16,
  transformOrigin: {
    y: 'top',
    x: 'left',
  },
  TransitionComponent: Grow,
  transitionDuration: 200,
};

export default Popover;
