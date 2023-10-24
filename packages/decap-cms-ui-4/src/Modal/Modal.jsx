import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import warning from 'warning';
import keycode from 'keycode';
import ownerDocument from '../utils/ownerDocument';
import RootRef from '../RootRef';
import Portal from '../Portal';
import { createChainedFunction } from '../utils/helpers';
import ModalManager from './ModalManager';
import Backdrop from '../Backdrop';
import { ariaHidden } from './manageAriaHidden';

function getContainer(container, defaultContainer) {
  container = typeof container === 'function' ? container() : container;
  // eslint-disable-next-line react/no-find-dom-node
  return ReactDOM.findDOMNode(container) || defaultContainer;
}

function getHasTransition(props) {
  return props.children ? Object.prototype.hasOwnProperty.call(props.children.props, 'in') : false;
}

const ModalWrap = styled.div`
  position: fixed;
  z-index: ${props => (props.zIndex ? props.zIndex : 1200)};
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  display: flex;
  align-items: ${props => {
    if (props.position.y === 'center') return 'center';
    if (props.position.y === 'top') return 'flex-start';
    if (props.position.y === 'bottom') return 'flex-end';
    if (props.position.y === 'stretch') return 'stretch';
  }};
  justify-content: ${props => {
    if (props.position.x === 'center') return 'center';
    if (props.position.x === 'left') return 'flex-start';
    if (props.position.x === 'right') return 'flex-end';
    if (props.position.x === 'stretch') return 'stretch';
  }};
`;

class Modal extends React.Component {
  mounted = false;

  constructor(props) {
    super();
    this.state = {
      exited: !props.open,
    };
  }

  componentDidMount() {
    this.mounted = true;

    if (this.props.open) this.handleOpen();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.open && !this.props.open) {
      this.handleClose();
    } else if (!prevProps.open && this.props.open) {
      this.lastFocus = ownerDocument(this.mountNode).activeElement;
      this.handleOpen();
    }
  }

  componentWillUnmount() {
    this.mounted = false;

    if (this.props.open || (getHasTransition(this.props) && !this.state.exited)) {
      this.handleClose();
    }
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.open) return { exited: false };
    if (!getHasTransition(nextProps)) return { exited: true };

    return null;
  }

  handleOpen = () => {
    const doc = ownerDocument(this.mountNode);
    const container = getContainer(this.props.container, doc.body);

    this.props.manager.add(this, container);
    doc.addEventListener('keydown', this.handleDocumentKeyDown);
    doc.addEventListener('focus', this.enforceFocus, true);

    if (this.dialogRef) this.handleOpened();
  };

  handleRendered = () => {
    if (this.props.onRendered) this.props.onRendered();
    if (this.props.open) {
      this.handleOpened();
    } else {
      ariaHidden(this.modalRef, true);
    }
  };

  handleOpened = () => {
    this.autoFocus();
    this.modalRef.scrollTop = 0;
  };

  handleClose = () => {
    this.props.manager.remove(this);

    const doc = ownerDocument(this.mountNode);

    doc.removeEventListener('keydown', this.handleDocumentKeyDown);
    doc.removeEventListener('focus', this.enforceFocus, true);

    this.restoreLastFocus();
  };

  handleExited = () => {
    this.setState({ exited: true });
  };

  handleBackdropClick = event => {
    if (event.target !== event.currentTarget) return;
    if (this.props.onBackdropClick) this.props.onBackdropClick(event);
    if (!this.props.disableBackdropClick && this.props.onClose)
      this.props.onClose(event, 'backdropClick');
  };

  handleDocumentKeyDown = event => {
    if (keycode(event) !== 'esc' || !this.isTopModal() || event.defaultPrevented) return;
    if (this.props.onEscapeKeyDown) this.props.onEscapeKeyDown(event);
    if (!this.props.disableEscapeKeyDown && this.props.onClose)
      this.props.onClose(event, 'escapeKeyDown');
  };

  enforceFocus = () => {
    if (!this.isTopModal() || this.props.disableEnforceFocus || !this.mounted || !this.dialogRef)
      return;

    const currentActiveElement = ownerDocument(this.mountNode).activeElement;

    if (!this.dialogRef.contains(currentActiveElement)) this.dialogRef.focus();
  };

  handlePortalRef = ref => {
    this.mountNode = ref ? ref.getMountNode() : ref;
  };

  handleModalRef = ref => {
    this.modalRef = ref;
  };

  onRootRef = ref => {
    this.dialogRef = ref;
  };

  autoFocus() {
    if (this.props.disableAutoFocus || !this.dialogRef) return;

    const currentActiveElement = ownerDocument(this.mountNode).activeElement;

    if (!this.dialogRef.contains(currentActiveElement)) {
      if (!this.dialogRef.hasAttribute('tabIndex')) {
        warning(
          false,
          [
            'The modal content node does not accept focus.',
            'For the benefit of assistive technologies, ' +
              'the tabIndex of the node is being set to "-1".',
          ].join('\n'),
        );
        this.dialogRef.setAttribute('tabIndex', -1);
      }

      this.lastFocus = currentActiveElement;
      this.dialogRef.focus();
    }
  }

  restoreLastFocus() {
    if (this.props.disableRestoreFocus || !this.lastFocus) return;
    if (this.lastFocus.focus) this.lastFocus.focus();

    this.lastFocus = null;
  }

  isTopModal() {
    return this.props.manager.isTopModal(this);
  }

  render() {
    const {
      BackdropComponent,
      BackdropProps,
      children,
      className,
      container,
      disablePortal,
      hideBackdrop,
      keepMounted,
      open,
      position,
      zIndex,
    } = this.props;
    const { exited } = this.state;
    const hasTransition = getHasTransition(this.props);

    if (!keepMounted && !open && (!hasTransition || exited)) return null;

    const childProps = {};

    if (hasTransition)
      childProps.onExited = createChainedFunction(this.handleExited, children.props.onExited);
    if (children.props.role === undefined) childProps.role = children.props.role || 'document';
    if (children.props.tabIndex === undefined)
      childProps.tabIndex = children.props.tabIndex || '-1';

    return (
      <Portal
        ref={this.handlePortalRef}
        container={container}
        disablePortal={disablePortal}
        onRendered={this.handleRendered}
      >
        <ModalWrap
          className={className}
          ref={this.handleModalRef}
          position={position}
          zIndex={zIndex}
        >
          {hideBackdrop ? null : (
            <BackdropComponent open={open} onClick={this.handleBackdropClick} {...BackdropProps} />
          )}
          <RootRef rootRef={this.onRootRef}>{React.cloneElement(children, childProps)}</RootRef>
        </ModalWrap>
      </Portal>
    );
  }
}

Modal.propTypes = {
  BackdropComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  BackdropProps: PropTypes.object,
  children: PropTypes.element,
  container: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  disableAutoFocus: PropTypes.bool,
  disableBackdropClick: PropTypes.bool,
  disableEnforceFocus: PropTypes.bool,
  disableEscapeKeyDown: PropTypes.bool,
  disablePortal: PropTypes.bool,
  disableRestoreFocus: PropTypes.bool,
  hideBackdrop: PropTypes.bool,
  keepMounted: PropTypes.bool,
  manager: PropTypes.object,
  onBackdropClick: PropTypes.func,
  onClose: PropTypes.func,
  onEscapeKeyDown: PropTypes.func,
  onRendered: PropTypes.func,
  open: PropTypes.bool.isRequired,
  position: PropTypes.object,
};

Modal.defaultProps = {
  BackdropComponent: Backdrop,
  disableAutoFocus: false,
  disableBackdropClick: false,
  disableEnforceFocus: false,
  disableEscapeKeyDown: false,
  disablePortal: false,
  disableRestoreFocus: false,
  hideBackdrop: false,
  keepMounted: false,
  manager: new ModalManager(),
  position: { x: 'center', y: 'center' },
};

export default Modal;
