import React from 'react';
import PropTypes from 'prop-types';

import Modal from './Modal';
import Grow from './transitions/Grow';
import Slide from './transitions/Slide';
import Button, { StyledButton } from './Button';
import { isWindowDown } from '../utils/responsive';

import styled from '@emotion/styled';
import ButtonGroup from './ButtonGroup';

const DialogWrap = styled.div`
  background-color: ${({ theme }) => theme.color.elevatedSurface};
  outline: none;
  border-radius: ${({ isMobile }) => (isMobile ? 0 : 8)}px;
  ${props => !props.width && props.position.x !== 'stretch' && `min-width: 20rem;`}
  ${props => !props.width && props.position.x !== 'stretch' && `max-width: 30rem;`}
  ${props => props.width && `width: ${props.width};`}
  box-shadow:
    ${props => {
      if (props.position.x === 'center') return 0;
      if (props.position.x === 'left') return 4;
      if (props.position.x === 'right') return -4;
      if (props.position.x === 'stretch') return 0;
    }}px ${props => {
  if (props.position.y === 'center') return 4;
  if (props.position.y === 'top') return 4;
  if (props.position.y === 'bottom') return -4;
  if (props.position.y === 'stretch') return 0;
}}px 16px ${({ theme }) =>
  theme.darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(14,30,37,0.25)'}, ${props => {
  if (props.position.x === 'center') return 0;
  if (props.position.x === 'left') return 32;
  if (props.position.x === 'right') return -32;
  if (props.position.x === 'stretch') return 0;
}}px ${props => {
  if (props.position.y === 'center') return 32;
  if (props.position.y === 'top') return 32;
  if (props.position.y === 'bottom') return -32;
  if (props.position.y === 'stretch') return 0;
}}px 64px ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(14,30,37,0.15)')};
${props => props.position.x === 'stretch' && `flex: 1;`}
`;
const Header = styled.div`
  justify-content: space-between;
  align-items: center;
`;
const H1 = styled.h1`
  color: ${({ theme }) => theme.color.highEmphasis};
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1em;
  padding: 2rem ${props => (props.hasCloseButton ? 2 : 1)}rem
    ${props => (props.hasContent ? 1 : 2)}rem 2rem;
  margin: 0;
  margin-right: 3.5rem;
  margin-bottom: 0.5rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin-right: 0;
    padding: 1.25rem ${props => (props.hasCloseButton ? 1 : 0.5)}rem
      ${props => (props.hasContent ? 0.5 : 1)}rem 1rem;
  }
`;
const CloseButton = styled(Button).attrs(() => ({
  icon: 'x',
  iconSize: '1.5rem',
  type: 'danger',
}))`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;
const DialogContent = styled.div`
  line-height: 1.5;
  color: ${({ theme }) => theme.color.mediumEmphasis};
  padding: ${props => (props.hasTitle || props.noPadding ? 0 : 1)}rem
    ${props => {
      if (props.hasCloseButton && !props.hasTitle && !props.noPadding) return 2;
      if (props.noPadding) return 0;
      return 2;
    }}rem
    ${props => {
      if (props.noPadding) return 0;
      if (props.hasActions) return 1.5;
      return 2;
    }}rem
    ${props => (props.noPadding ? 0 : 2)}rem;

  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    padding: ${props => (props.hasTitle || props.noPadding ? 0 : 0.5)}rem
      ${props => {
        if (props.hasCloseButton && !props.hasTitle && !props.noPadding) return 1;
        if (props.noPadding) return 0;
        return 1;
      }}rem
      ${props => {
        if (props.noPadding) return 0;
        if (props.hasActions) return 1.25;
        return 1.25;
      }}rem
      ${props => (props.noPadding ? 0 : 1)}rem;
  }
`;
const DialogActions = styled.div`
  padding: 0 2rem 2rem 2rem;
  /* border-top: 1px solid ${({ theme }) => theme.color.border}; */
  display: flex;
  justify-content: flex-end;
  ${({ isMobile }) =>
    isMobile
      ? `
    flex: 1;
    flex-direction: column;
    align-items: stretch;
    & ${ButtonGroup} {
      flex: 1;
      flex-direction: column;
      align-items: stretch;
    }
  `
      : ``}
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    padding: 0 1rem 1.25rem 1rem;
    & ${StyledButton} {
      padding: 10px;
      font-size: 1rem;
    }
  }
`;

class Dialog extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    onClose: PropTypes.func,
  };

  handleBackdropClick = event => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (this.props.onBackdropClick) {
      this.props.onBackdropClick(event);
    }

    if (!this.props.disableBackdropClick && this.props.onClose) {
      this.props.onClose(event, 'backdropClick');
    }
  };

  render() {
    const {
      open,
      title,
      actions,
      onClose,
      children,
      hideCloseButton,
      transitionDuration,
      BackdropProps,
      disableBackdropClick,
      disableEscapeKeyDown,
      noPadding,
      onEscapeKeyDown,
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
      width,
      zIndex,
      ...other
    } = this.props;

    let { TransitionComponent, TransitionProps } = this.props;

    const isMobile = isWindowDown('xs');

    let position = isMobile
      ? { x: 'stretch', y: 'bottom' }
      : this.props.position
      ? { ...this.props.position }
      : { x: 'center', y: 'center' };

    let direction = null;

    if (position.x === 'left') direction = 'right';
    if (position.x === 'right') direction = 'left';
    if (position.y === 'top') direction = 'down';
    if (position.y === 'bottom') direction = 'up';
    if (isMobile) {
      direction = 'up';
    }

    if (
      position.x === 'left' ||
      position.x === 'right' ||
      position.y === 'top' ||
      position.y === 'bottom'
    ) {
      TransitionComponent = Slide;
    }

    console.log('dialog', { position, isMobile });

    return (
      <Modal
        BackdropProps={{
          transitionDuration,
          ...BackdropProps,
        }}
        disableBackdropClick={disableBackdropClick}
        disableEscapeKeyDown={disableEscapeKeyDown}
        onBackdropClick={this.handleBackdropClick}
        onEscapeKeyDown={onEscapeKeyDown}
        onClose={onClose}
        open={open}
        position={position}
        role="dialog"
        zIndex={zIndex}
        {...other}
      >
        <TransitionComponent
          appear
          in={open}
          timeout={transitionDuration}
          onEnter={onEnter}
          onEntering={onEntering}
          onEntered={onEntered}
          onExit={onExit}
          onExiting={onExiting}
          onExited={onExited}
          direction={direction}
          {...TransitionProps}
        >
          <DialogWrap width={width} position={position} isMobile={isMobile}>
            <Header>
              {title && (
                <H1 hasContent={children} hasCloseButton={!hideCloseButton}>
                  {title}
                </H1>
              )}
              {!hideCloseButton && <CloseButton onClick={onClose} />}
            </Header>
            {children && (
              <DialogContent
                noPadding={noPadding}
                hasTitle={title}
                hasActions={actions}
                hasCloseButton={!hideCloseButton}
              >
                {children}
              </DialogContent>
            )}
            {actions && <DialogActions isMobile={isMobile}>{actions}</DialogActions>}
          </DialogWrap>
        </TransitionComponent>
      </Modal>
    );
  }
}

Dialog.defaultProps = {
  TransitionComponent: Grow,
  transitionDuration: 200,
};

export default Dialog;
