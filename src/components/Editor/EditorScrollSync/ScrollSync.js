import React, { Component } from 'react'
import PropTypes from 'prop-types'

/**
 * ScrollSync provider component
 *
 */

export default class ScrollSync extends Component {

  static propTypes = {
    children: PropTypes.element.isRequired,
    proportional: PropTypes.bool,
    vertical: PropTypes.bool,
    horizontal: PropTypes.bool,
    enabled: PropTypes.bool
  };

  static defaultProps = {
    proportional: true,
    vertical: true,
    horizontal: true,
    enabled: true
  };

  static childContextTypes = {
    registerPane: PropTypes.func,
    unregisterPane: PropTypes.func
  }

  getChildContext() {
    return {
      registerPane: this.registerPane,
      unregisterPane: this.unregisterPane
    }
  }

  panes = {}

  registerPane = (node, group) => {
    if (!this.panes[group]) {
      this.panes[group] = []
    }

    if (!this.findPane(node, group)) {
      this.addEvents(node, group)
      this.panes[group].push(node)
    }
  }

  unregisterPane = (node, group) => {
    if (this.findPane(node, group)) {
      this.removeEvents(node)
      this.panes[group].splice(this.panes[group].indexOf(node), 1)
    }
  }

  addEvents = (node, group) => {
    /* For some reason element.addEventListener doesnt work with document.body */
    node.onscroll = this.handlePaneScroll.bind(this, node, group) // eslint-disable-line
  }

  removeEvents = (node) => {
    /* For some reason element.removeEventListener doesnt work with document.body */
    node.onscroll = null // eslint-disable-line
  }

  findPane = (node, group) => {
    if (!this.panes[group]) {
      return false
    }

    return this.panes[group].find(pane => pane === node)
  }

  handlePaneScroll = (node, group) => {
    if (!this.props.enabled) {
      return;
    }

    window.requestAnimationFrame(() => {
      this.syncScrollPositions(node, group)
    })
  }

  syncScrollPositions = (scrolledPane, group) => {
    const {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollLeft,
      scrollWidth,
      clientWidth
    } = scrolledPane

    const scrollTopOffset = scrollHeight - clientHeight
    const scrollLeftOffset = scrollWidth - clientWidth

    const { proportional, vertical, horizontal } = this.props

    this.panes[group].forEach((pane) => {
      /* For all panes beside the currently scrolling one */
      if (scrolledPane !== pane) {
        /* Remove event listeners from the node that we'll manipulate */
        this.removeEvents(pane, group)
        /* Calculate the actual pane height */
        const paneHeight = pane.scrollHeight - clientHeight
        const paneWidth = pane.scrollWidth - clientWidth
        /* Adjust the scrollTop position of it accordingly */
        if (vertical && scrollTopOffset > 0) {
          pane.scrollTop = proportional ? (paneHeight * scrollTop) / scrollTopOffset : scrollTop // eslint-disable-line
        }
        if (horizontal && scrollLeftOffset > 0) {
          pane.scrollLeft = proportional ? (paneWidth * scrollLeft) / scrollLeftOffset : scrollLeft // eslint-disable-line
        }
        /* Re-attach event listeners after we're done scrolling */
        window.requestAnimationFrame(() => {
          this.addEvents(pane, group)
        })
      }
    })
  }

  render() {
    return React.Children.only(this.props.children)
  }
}
