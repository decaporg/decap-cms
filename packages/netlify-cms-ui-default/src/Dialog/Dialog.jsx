import React from 'react';
import PropTypes from 'prop-types';

import Modal from '../Modal';
import Card from '../Card';
import Grow from '../transitions/Grow';
import Slide from '../transitions/Slide';
import { ButtonGroup, IconButton } from '../Button';
import { StyledButton } from '../Button/Button';
import { isWindowDown } from '../utils/responsive';

import styled from '@emotion/styled';

const DialogWrap = styled(Card)`
  outline: none;
  ${({ position, width }) => !width && position.x !== 'stretch' && `min-width: 20rem;`}
  ${({ position, width }) => !width && position.x !== 'stretch' && `max-width: 30rem;`}
  ${({ width }) => width && `width: ${width};`}
  ${({ position }) => position.x === 'stretch' && `flex: 1;`}
  border-radius: ${({ position }) => {
    if (
      (position.x === 'center' && position.y === 'center') ||
      (position.x === 'right' && position.y === 'center') ||
      (position.x === 'center' && position.y === 'bottom') ||
      (position.x === 'right' && position.y === 'bottom')
    )
      return 8;
    return 0;
  }}px ${({ position }) => {
  if (
    (position.x === 'center' && position.y === 'center') ||
    (position.x === 'left' && position.y === 'center') ||
    (position.x === 'center' && position.y === 'bottom') ||
    (position.x === 'left' && position.y === 'bottom')
  )
    return 8;
  return 0;
}}px ${({ position }) => {
  if (
    (position.x === 'center' && position.y === 'center') ||
    (position.x === 'left' && position.y === 'center') ||
    (position.x === 'center' && position.y === 'top') ||
    (position.x === 'left' && position.y === 'top')
  )
    return 8;
  return 0;
}}px ${({ position }) => {
  if (
    (position.x === 'center' && position.y === 'center') ||
    (position.x === 'right' && position.y === 'center') ||
    (position.x === 'center' && position.y === 'top') ||
    (position.x === 'right' && position.y === 'top')
  )
    return 8;
  return 0;
}}px;
`;

// const DialogWrap = styled.div`
//   background-color: ${({ theme }) => theme.color.elevatedSurface};
//   outline: none;
//
//   ${({ position, width }) => !width && position.x !== 'stretch' && `min-width: 20rem;`}
//   ${({ position, width }) => !width && position.x !== 'stretch' && `max-width: 30rem;`}
//   ${({ width }) => width && `width: ${width};`}
//   box-shadow:
//     ${({ position }) => {
//       if (position.x === 'center') return 0;
//       if (position.x === 'left') return 4;
//       if (position.x === 'right') return -4;
//       if (position.x === 'stretch') return 0;
//     }}px ${({ position }) => {
//   if (position.y === 'center') return 4;
//   if (position.y === 'top') return 4;
//   if (position.y === 'bottom') return -4;
//   if (position.y === 'stretch') return 0;
// }}px 16px ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(14,30,37,0.25)')}, ${({
//   position,
// }) => {
//   if (position.x === 'center') return 0;
//   if (position.x === 'left') return 32;
//   if (position.x === 'right') return -32;
//   if (position.x === 'stretch') return 0;
// }}px ${({ position }) => {
//   if (position.y === 'center') return 32;
//   if (position.y === 'top') return 32;
//   if (position.y === 'bottom') return -32;
//   if (position.y === 'stretch') return 0;
// }}px 64px ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(14,30,37,0.15)')};
// ${({ position }) => position.x === 'stretch' && `flex: 1;`}
// `;
const Header = styled.div`
  justify-content: space-between;
  align-items: center;
`;
const Title = styled.h1`
  color: ${({ theme }) => theme.color.highEmphasis};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 2rem;
  padding: ${({ hasContent, hasCloseButton }) => `1.5rem ${hasCloseButton ? 2 : 1}rem
    ${hasContent ? 1 : 2}rem 2rem`};
  margin: 0;
  margin-right: 3.5rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin-right: 0;
    padding: 1.25rem ${props => (props.hasCloseButton ? 1 : 0.5)}rem
      ${props => (props.hasContent ? 0.5 : 1)}rem 1rem;
  }
`;
const CloseButton = styled(IconButton)`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;
CloseButton.defaultProps = {
  icon: 'x',
  size: 'large',
  type: 'danger',
};
const DialogContent = styled.div`
  font-family: ${({ theme }) => theme.fontFamily};
  line-height: 1.5;
  color: ${({ theme }) => theme.color.mediumEmphasis};
  padding: ${props => (props.hasTitle || props.noPadding ? 0 : 1.75)}rem
    ${props => {
      if (props.hasCloseButton && !props.hasTitle && !props.noPadding) return 5;
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
    padding: ${props => (props.hasTitle || props.noPadding ? 0 : 1)}rem
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
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    padding: 0 1rem 1.25rem 1rem;
    & ${StyledButton} {
      padding: 10px;
      font-size: 1rem;
    }
  }
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
      className,
      hideCloseButton,
      transitionDuration,
      BackdropProps,
      disableBackdropClick,
      disableEscapeKeyDown,
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

    const position = isMobile
      ? { x: 'stretch', y: 'bottom' }
      : this.props.position
      ? { ...this.props.position }
      : { x: 'center', y: 'center' };
    console.log({ isMobile, position });

    let direction;

    if (position.x === 'left') direction = 'right';
    if (position.x === 'right') direction = 'left';
    if (position.y === 'top') direction = 'down';
    if (position.y === 'bottom') direction = 'up';

    if (
      position.x === 'left' ||
      position.x === 'right' ||
      position.y === 'top' ||
      position.y === 'bottom'
    ) {
      TransitionComponent = Slide;
    }

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
        role="dialog"
        zIndex={zIndex}
        {...other}
        position={position}
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
          <DialogWrap
            width={width}
            direction={direction ? direction : 'down'}
            elevation="lg"
            position={position}
            isMobile={isMobile}
            className={className}
          >
            {title && (
              <Header>
                <Title hasCloseButton={!hideCloseButton} hasContent={children} hasActions={actions}>
                  {title}
                </Title>
                {!hideCloseButton && (title || actions) && <CloseButton onClick={onClose} />}
              </Header>
            )}
            {children && (title || actions) ? (
              <DialogContent
                noPadding={!title && !actions}
                hasTitle={!!title}
                hasActions={!!actions}
                hasCloseButton={!hideCloseButton}
              >
                {children}
              </DialogContent>
            ) : (
              children
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
