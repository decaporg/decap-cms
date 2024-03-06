import css from 'dom-helpers/css';
import getScrollbarSize from 'dom-helpers/scrollbarSize';
import isOverflowing from './isOverflowing';
import { ariaHidden, ariaHiddenSiblings } from './manageAriaHidden';

function findIndexOf(data, callback) {
  let idx = -1;
  data.some((item, index) => {
    if (callback(item)) {
      idx = index;
      return true;
    }
    return false;
  });
  return idx;
}

function getPaddingRight(node) {
  return parseInt(css(node, 'paddingRight') || 0, 10);
}

function setContainerStyle(data, container) {
  const style = { overflow: 'hidden' };

  data.style = {
    overflow: container.style.overflow,
    paddingRight: container.style.paddingRight,
  };

  if (data.overflowing) {
    const scrollbarSize = getScrollbarSize();

    style.paddingRight = `${getPaddingRight(container) + scrollbarSize}px`;
  }

  Object.keys(style).forEach(key => {
    container.style[key] = style[key];
  });
}

function removeContainerStyle(data) {
  Object.keys(data.style).forEach(key => {
    data.container.style[key] = data.style[key];
  });
}

class ModalManager {
  constructor(options = {}) {
    const { hideSiblingNodes = true, handleContainerOverflow = true } = options;
    this.hideSiblingNodes = hideSiblingNodes;
    this.handleContainerOverflow = handleContainerOverflow;
    this.modals = [];
    this.data = [];
  }

  add(modal, container) {
    let modalIdx = this.modals.indexOf(modal);

    if (modalIdx !== -1) return modalIdx;

    modalIdx = this.modals.length;
    this.modals.push(modal);

    if (modal.modalRef) ariaHidden(modal.modalRef, false);
    if (this.hideSiblingNodes) ariaHiddenSiblings(container, modal.mountNode, modal.modalRef, true);

    const containerIdx = findIndexOf(this.data, item => item.container === container);

    if (containerIdx !== -1) {
      this.data[containerIdx].modals.push(modal);
      return modalIdx;
    }

    const data = {
      modals: [modal],
      container,
      overflowing: isOverflowing(container),
      prevPaddings: [],
    };

    if (this.handleContainerOverflow) setContainerStyle(data, container);

    this.data.push(data);

    return modalIdx;
  }

  remove(modal) {
    const modalIdx = this.modals.indexOf(modal);

    if (modalIdx === -1) return modalIdx;

    const containerIdx = findIndexOf(this.data, item => item.modals.indexOf(modal) !== -1);
    const data = this.data[containerIdx];

    data.modals.splice(data.modals.indexOf(modal), 1);
    this.modals.splice(modalIdx, 1);

    if (data.modals.length === 0) {
      if (this.handleContainerOverflow) removeContainerStyle(data);
      if (modal.modalRef) ariaHidden(modal.modalRef, true);
      if (this.hideSiblingNodes)
        ariaHiddenSiblings(data.container, modal.mountNode, modal.modalRef, false);
      this.data.splice(containerIdx, 1);
    } else if (this.hideSiblingNodes) {
      const nextTop = data.modals[data.modals.length - 1];

      if (nextTop.modalRef) ariaHidden(nextTop.modalRef, false);
    }

    return modalIdx;
  }

  isTopModal(modal) {
    return !!this.modals.length && this.modals[this.modals.length - 1] === modal;
  }
}

export default ModalManager;
