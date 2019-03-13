import React from 'react';
import PropTypes from 'prop-types';
import { css, Global, ClassNames } from '@emotion/core';
import ReactModal from 'react-modal';
import { transitions, shadows, lengths } from 'netlify-cms-ui-default';

const ReactModalGlobalStyles = () => (
  <Global
    styles={css`
      .ReactModal__Body--open {
        overflow: hidden;
      }
    `}
  />
);

const styleStrings = {
  modalBody: `
    ${shadows.dropDeep};
    background-color: #fff;
    border-radius: ${lengths.borderRadius};
    height: 80%;
    text-align: center;
    max-width: 2200px;
    padding: 20px;

    &:focus {
      outline: none;
    }
  `,
  overlay: `
    z-index: 99999;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    background-color: rgba(0, 0, 0, 0);
    transition: background-color ${transitions.main}, opacity ${transitions.main};
  `,
  overlayAfterOpen: `
    background-color: rgba(0, 0, 0, 0.6);
    opacity: 1;
  `,
  overlayBeforeClose: `
    background-color: rgba(0, 0, 0, 0);
    opacity: 0;
  `,
};

export class Modal extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool.isRequired,
    className: PropTypes.string,
    onClose: PropTypes.func.isRequired,
  };

  componentDidMount() {
    ReactModal.setAppElement('#nc-root');
  }

  render() {
    const { isOpen, children, className, onClose } = this.props;
    return (
      <>
        <ReactModalGlobalStyles />
        <ClassNames>
          {({ css, cx }) => (
            <ReactModal
              isOpen={isOpen}
              onRequestClose={onClose}
              closeTimeoutMS={300}
              className={{
                base: cx(
                  css`
                    ${styleStrings.modalBody};
                  `,
                  className,
                ),
                afterOpen: '',
                beforeClose: '',
              }}
              overlayClassName={{
                base: css`
                  ${styleStrings.overlay};
                `,
                afterOpen: css`
                  ${styleStrings.overlayAfterOpen};
                `,
                beforeClose: css`
                  ${styleStrings.overlayBeforeClose};
                `,
              }}
            >
              {children}
            </ReactModal>
          )}
        </ClassNames>
      </>
    );
  }
}
