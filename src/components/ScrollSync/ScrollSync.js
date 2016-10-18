import React, { Component, PropTypes } from 'react';
import { without } from 'lodash';

export default class ScrollSync extends Component {

  static propTypes = {
    children: PropTypes.element.isRequired,
  };

  static childContextTypes = {
    registerPane: PropTypes.func,
    unregisterPane: PropTypes.func,
  };

  panes = [];

  getChildContext() {
    return {
      registerPane: this.registerPane,
      unregisterPane: this.unregisterPane,
    };
  }

  registerPane = (node) => {
    if (!this.findPane(node)) {
      this.addEvents(node);
      this.panes.push(node);
    }
  };

  unregisterPane = (node) => {
    if (this.findPane(node)) {
      this.removeEvents(node);
      this.panes = without(this.panes, node);
    }
  };

  addEvents = (node) => {
    node.onscroll = this.handlePaneScroll.bind(this, node);
    // node.addEventListener('scroll', this.handlePaneScroll, false)
  };

  removeEvents = (node) => {
    node.onscroll = null;
    // node.removeEventListener('scroll', this.handlePaneScroll, false)
  };

  findPane = (node) => {
    return this.panes.find(p => p === node);
  };

  handlePaneScroll = (node) => {
    // const node = evt.target
    window.requestAnimationFrame(() => {
      this.syncScrollPositions(node);
    });
  };

  syncScrollPositions = (scrolledPane) => {
    const { scrollTop, scrollHeight, clientHeight } = scrolledPane;
    this.panes.forEach((pane) => {
      /* For all panes beside the currently scrolling one */
      if (scrolledPane !== pane) {
        /* Remove event listeners from the node that we'll manipulate */
        this.removeEvents(pane);
        /* Calculate the actual pane height */
        const paneHeight = pane.scrollHeight - clientHeight;
        /* Adjust the scrollTop position of it accordingly */
        pane.scrollTop = paneHeight * scrollTop / (scrollHeight - clientHeight);
        /* Re-attach event listeners after we're done scrolling */
        window.requestAnimationFrame(() => {
          this.addEvents(pane);
        });
      }
    });
  };

  render() {
    return React.Children.only(this.props.children);
  }
}
