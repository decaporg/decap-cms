import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';
import { partial, without } from 'lodash';
import styles from './Sticky.css';

/**
 * Sticky is a collection of three components meant to facilitate "sticky" UI
 * behavior for nested components. It uses React Context to provide an isolated,
 * children-accessible state machine. It was specifically built for the rich
 * text editor toolbar to achieve the following:
 *
 * - work within a scrollable section as if it were the window
 * - remain at the top of the scrollable section if the rich text field begins
 *   to scroll up and out
 * - scroll away with the rich text field when it is almost out of view
 * - work when multiple rich text fields are present
 *
 * No available solution was near facilitating this for a React app. Eventually,
 * if use continues, it should be improved to be more abstract and potentially
 * split off to a separate library unto itself, covering more use cases than
 * just the rich text toolbar.
 *
 * Sticky consists of three components, which are documented right here to
 * facilitate a concise, high level overview:
 *
 * - StickyContext: the scrollable area that essentially serves as the window
 *   should be wrapped in StickyContext
 * - StickyContainer: wraps the secondary container that the sticky element is
 *   bound within, eg. the rich text field
 * - Sticky: wraps the sticky element itself
 */

export class StickyContext extends Component {
  static childContextTypes = {
    subscribeToStickyContext: PropTypes.func,
    unsubscribeToStickyContext: PropTypes.func,
    requestUpdate: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,

    /**
     * registerListener: accepts a function that is called with the `updateStickies` method as an
     * arg, so it can be accessed from the component implementation site similar to how refs are
     * accessed:
     *
     * <StickyContext registerListener={fn => this.updateStickyContext = fn}>
     *
     * This function can then be used from the component implementation site to force update the
     * entire Sticky instance, which is sometimes necessary.
     */
    registerListener: PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.subscriptions = [];
  }

  subscribeToStickyContext = (fn) => {
    this.subscriptions.push(fn);
  };

  getChildContext() {
    return {
      subscribeToStickyContext: this.subscribeToStickyContext,
      unsubscribeToStickyContext: (fn) => { this.subscriptions = without(this.subscriptions, fn); },
      requestUpdate: () => { window.setTimeout(() => { this.updateStickies.call(this, this.ref); }); },
    };
  }

  updateStickies = (ref) => {
    const stickyContextTop = ref && ref.getBoundingClientRect().top;
    this.subscriptions.forEach((fn) => { fn(stickyContextTop); });
  };

  componentDidMount() {
    this.updateStickies(this.ref);
    this.props.registerListener(this.updateStickies.bind(this, this.ref));
  }

  handleScroll = (event) => {
    if (event.target === this.ref) {
      this.updateStickies(this.ref);
    }
  };

  render() {
    return (
      <div className={this.props.className} onScroll={this.handleScroll} ref={(ref) => { this.ref = ref; }}>
        {this.props.children}
      </div>
    );
  }
}

export class StickyContainer extends Component {
  constructor(props) {
    super(props);
    this.subscriptions = [];
  }

  static contextTypes = {
    subscribeToStickyContext: PropTypes.func,
    unsubscribeToStickyContext: PropTypes.func,
    requestUpdate: PropTypes.func,
  };

  static childContextTypes = {
    subscribeToStickyContainer: PropTypes.func,
    unsubscribeToStickyContainer: PropTypes.func,
    requestUpdate: PropTypes.func,
  };

  getChildContext() {
    return {
      subscribeToStickyContainer: (fn) => { this.subscriptions.push(fn); },
      unsubscribeToStickyContainer: (fn) => { this.subscriptions = without(this.subscriptions, fn); },
      requestUpdate: () => { this.context.requestUpdate.call(this); },
    };
  }

  /**
   * getPosition: used for updating the sticky element to stick or not stick, and also provides
   * width info. Because a sticky element uses fixed positioning, it may not be able to be sized
   * relative to a parent, so the StickyContainer width is provided to allow the Sticky to be sized
   * accordingly.
   */
  getPosition = (contextTop) => {
    const rect = this.ref.getBoundingClientRect();
    const shouldStick = rect.top < contextTop;
    const shouldStickAtBottom = rect.bottom - 60 < contextTop;
    this.subscriptions.forEach((fn) => { fn(shouldStick, shouldStickAtBottom, rect.width); });
  };

  componentDidMount() {
    this.context.subscribeToStickyContext(this.getPosition);
  }

  componentWillUnmount() {
    this.context.unsubscribeToStickyContext(this.getPosition);
  }

  render() {
    return (
      <div
        id={this.context.string}
        className={classnames(this.props.className, styles.stickyContainer)}
        ref={(ref) => { this.ref = ref }}
      >
        {this.props.children}
      </div>
    );
  }
}

export class Sticky extends Component {
  static contextTypes = {
    subscribeToStickyContainer: PropTypes.func,
    unsubscribeToStickyContainer: PropTypes.func,
    requestUpdate: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,

    /**
     * classNameActive: class to apply when Sticky is active.
     */
    classNameActive: PropTypes.string,

    /**
     * fillContainerWidth: allows the sticky width to be dynamically set to the width of it's
     * StickyContainer when sticky (fixed positioning).
     */
    fillContainerWidth: PropTypes.bool,
  }

  constructor(props, context) {
    super(props, context);
    this.state = {};
  }

  updateSticky = (shouldStick, shouldStickAtBottom, containerWidth) => {
    this.setState({ shouldStick, shouldStickAtBottom, containerWidth });
  };

  componentDidMount() {
    this.context.subscribeToStickyContainer(this.updateSticky);
    this.context.requestUpdate();
  }

  componentWillUnmount() {
    this.context.unsubscribeToStickyContainer(this.updateSticky);
  }

  render() {
    const { props, state } = this;
    const stickyPlaceholderHeight = state.shouldStick ? this.ref.getBoundingClientRect().height : 0;

    return (
      <div>
        <div style={{paddingBottom: stickyPlaceholderHeight}}></div>
        <div
          className={classnames(
            props.className,
            styles.sticky,
            {
              [styles.stickyActive]: state.shouldStick,
              [props.classNameActive]: state.shouldStick,
              [styles.stickyAtBottom]: state.shouldStickAtBottom,
            },
          )}
          style={
            props.fillContainerWidth && state.containerWidth && state.shouldStick ?
            { width: state.containerWidth } :
            null
          }
          ref={(ref) => {this.ref = ref}}
        >
          {props.children}
        </div>
      </div>
    );
  }
}
