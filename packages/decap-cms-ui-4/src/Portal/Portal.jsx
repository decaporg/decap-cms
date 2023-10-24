import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import ownerDocument from '../utils/ownerDocument';

function getContainer(container, defaultContainer) {
  container = typeof container === 'function' ? container() : container;
  // eslint-disable-next-line react/no-find-dom-node
  return ReactDOM.findDOMNode(container) || defaultContainer;
}

function getOwnerDocument(element) {
  // eslint-disable-next-line react/no-find-dom-node
  return ownerDocument(ReactDOM.findDOMNode(element));
}

class Portal extends React.Component {
  componentDidMount() {
    this.setMountNode(this.props.container);
    if (!this.props.disablePortal) this.forceUpdate(this.props.onRendered);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.container !== this.props.container ||
      prevProps.disablePortal !== this.props.disablePortal
    ) {
      this.setMountNode(this.props.container);
      if (!this.props.disablePortal) this.forceUpdate(this.props.onRendered);
    }
  }

  componentWillUnmount() {
    this.mountNode = null;
  }

  setMountNode(container) {
    if (this.props.disablePortal) {
      // eslint-disable-next-line react/no-find-dom-node
      this.mountNode = ReactDOM.findDOMNode(this).parentElement;
      return;
    }
    this.mountNode = getContainer(container, getOwnerDocument(this).body);
  }

  getMountNode = () => this.mountNode;

  render() {
    const { children, disablePortal } = this.props;

    if (disablePortal) {
      return children;
    }
    return this.mountNode ? ReactDOM.createPortal(children, this.mountNode) : null;
  }
}

Portal.propTypes = {
  children: PropTypes.node.isRequired,
  container: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  disablePortal: PropTypes.bool,
  onRendered: PropTypes.func,
};

Portal.defaultProps = {
  disablePortal: false,
};

export default Portal;
