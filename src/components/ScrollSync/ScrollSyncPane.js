import { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

export default class ScrollSyncPane extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    attachTo: PropTypes.any,
  };

  static contextTypes = {
    registerPane: PropTypes.func.isRequired,
    unregisterPane: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.node = this.props.attachTo || ReactDOM.findDOMNode(this);
    this.context.registerPane(this.node);
  }

  componentWillUnmount() {
    this.context.unregisterPane(this.node);
  }

  render() {
    return this.props.children;
  }
}
