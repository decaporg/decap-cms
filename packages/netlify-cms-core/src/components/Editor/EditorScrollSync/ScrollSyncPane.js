import { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

/**
 * ScrollSyncPane Component
 *
 * Wrap your content in it to keep its scroll position in sync with other panes
 *
 * @example ./example.md
 */


export default class ScrollSyncPane extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    attachTo: PropTypes.object,
    group: PropTypes.string
  }

  static defaultProps = {
    group: 'default'
  }

  static contextTypes = {
    registerPane: PropTypes.func.isRequired,
    unregisterPane: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.node = this.props.attachTo || ReactDOM.findDOMNode(this) // eslint-disable-line react/no-find-dom-node
    this.context.registerPane(this.node, this.props.group)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.group !== this.props.group) {
      this.context.unregisterPane(this.node, prevProps.group)
      this.context.registerPane(this.node, this.props.group)
    }
  }

  componentWillUnmount() {
    this.context.unregisterPane(this.node, this.props.group)
  }

  render() {
    return this.props.children
  }
}
