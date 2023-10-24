import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Card from '../Card';
import NavMenuGroupLabel from './NavMenuGroupLabel';
import NavMenuItem, { NavItemContents } from './NavMenuItem';
import MobileNavMenu from './MobileNavMenu';
import { isWindowDown } from '../utils/responsive';
import { useUIContext } from '../hooks';

const NavWrap = styled(Card)`
  width: ${({ collapsed }) => (collapsed ? '56px' : '240px')};
  height: 100%;
  padding: 12px 0;
  background-color: ${({ theme }) => theme.color.elevatedSurface};
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width ${({ collapsed }) => (collapsed ? '200ms' : '250ms')}
    cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
  overflow-y: auto;
  ${NavMenuGroupLabel} {
    margin-top: 0;
    opacity: 1;
    transition: ${({ collapsed }) => (collapsed ? '200ms' : '250ms')} cubic-bezier(0.4, 0, 0.2, 1);
  }
  ${NavItemContents} {
    width: 13.5rem;
    min-width: 13.5rem;
  }
  ${({ collapsed }) =>
    collapsed
      ? `
    ${NavMenuGroupLabel} {
      opacity: 0;
      margin-top: -1rem;
    }
  `
      : ``}
`;
NavWrap.defaultProps = { elevation: 'xs', rounded: false, direction: 'right' };

const NavContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;
const CondenseNavMenuItem = styled(NavMenuItem)`
  width: 3.5rem;
  & svg {
    transform: ${({ collapsed }) => (collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: 200ms;
  }
`;

const NavMenu = ({ children, collapsable }) => {
  const { navCollapsed: collapsed, setNavCollapsed: setCollapsed } = useUIContext();
  const [isMobile, setIsMobile] = useState(isWindowDown('xs'));
  const handleResize = () => setIsMobile(isWindowDown('xs'));

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return <MobileNavMenu>{children}</MobileNavMenu>;

  return (
    <NavWrap collapsed={collapsed}>
      <NavContent>{children}</NavContent>
      {collapsable && (
        <CondenseNavMenuItem
          icon="chevron-right"
          collapsed={collapsed}
          onClick={() => setCollapsed(!collapsed)}
        />
      )}
    </NavWrap>
  );
};

NavMenu.propTypes = {
  collapsable: PropTypes.bool,
};
NavMenu.defaultProps = {
  collapsable: false,
};

export default NavMenu;
