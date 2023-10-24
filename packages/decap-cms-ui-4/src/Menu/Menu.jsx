import React from 'react';
import styled from '@emotion/styled';
import Card from '../Card';
import Popover from '../Popover';
import { isWindowDown } from '../utils/responsive';
import { MenuItemWrap } from './MenuItem';

const MenuWrap = styled(Card)`
  padding: ${({ isMobile }) => (isMobile ? '0.5rem' : '0.25rem')};
  min-width: ${({ width }) => (width ? width : '200px')};
  & > ${MenuItemWrap} {
    ${({ isMobile }) => (isMobile ? `padding: 0.75rem;` : ``)}
  }
`;
MenuWrap.defaultProps = { elevation: 'md' };

const Menu = React.forwardRef(function Menu(props, ref) {
  const {
    children,
    className,
    onClose,
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
      anchorOrigin={{
        x: (anchorOrigin && anchorOrigin.x) || 'right',
        y: (anchorOrigin && anchorOrigin.y) || 'bottom',
      }}
      transformOrigin={{
        x: (transformOrigin && transformOrigin.x) || 'right',
        y: (transformOrigin && transformOrigin.y) || 'top',
      }}
      open={open}
      ref={ref}
      transitionDuration={transitionDuration}
      supportsMobile
      {...other}
    >
      <MenuWrap
        isMobile={isMobile}
        direction={isMobile ? 'up' : 'down'}
        rounded={isMobile ? false : 'lg'}
        className={className}
        width={width}
      >
        {children}
      </MenuWrap>
    </Popover>
  );
});

export default Menu;
