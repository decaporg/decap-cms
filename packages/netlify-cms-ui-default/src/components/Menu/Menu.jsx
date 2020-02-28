import React from 'react';
import styled from '@emotion/styled';
import Popover from '../Popover';
import { isWindowDown } from '../../utils/responsive';
import { MenuItemWrap } from './MenuItem';

const MenuWrap = styled.div`
  background: ${({ theme }) => theme.color.elevatedSurface};
  box-shadow: 0 0 4px 1px
      ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(14, 30, 37, 0.06)')},
    0 ${({ isMobile }) => (isMobile ? '-' : '')}8px 16px 0
      ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(14, 30, 37, 0.2)')};
  border-radius: ${({ isMobile }) => (isMobile ? 0 : '6px')};
  padding: ${({ isMobile }) => (isMobile ? '0.5rem' : '0.25rem')};
  min-width: ${({ width }) => (width ? width : '200px')};
  & > ${MenuItemWrap} {
    ${({ isMobile }) => (isMobile ? `padding: 0.75rem;` : ``)}
  }
`;

const Menu = React.forwardRef(function Menu(props, ref) {
  const {
    autoFocus: autoFocusProp,
    children,
    classes,
    className,
    onClose,
    onEntering,
    open,
    transitionDuration = 250,
    anchorOrigin,
    transformOrigin,
    width,
    ...other
  } = props;
  const firstValidItemRef = React.useRef(null);
  const firstSelectedItemRef = React.useRef(null);
  const getContentAnchorEl = () => firstSelectedItemRef.current || firstValidItemRef.current;
  const isMobile = isWindowDown('xs');

  return (
    <Popover
      getContentAnchorEl={getContentAnchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin || { y: 'top', x: 'left' }}
      transformOrigin={transformOrigin || { y: 'top', x: 'right' }}
      open={open}
      ref={ref}
      transitionDuration={transitionDuration}
      supportsMobile
      {...other}
    >
      <MenuWrap isMobile={isMobile} className={className} width={width}>
        {children}
      </MenuWrap>
    </Popover>
  );
});

export default Menu;
