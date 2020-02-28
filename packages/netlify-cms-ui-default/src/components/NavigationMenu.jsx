import React from 'react';
import styled from '@emotion/styled';
import NavigationMenuItem from './NavigationMenuItem';

const NavWrap = styled.div`
  width: ${({ collapsed }) => (collapsed ? '56px' : '240px')};
  padding: 12px 0;
  background-color: ${({ theme }) => theme.color.surface};
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 4px 0
    ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(121, 130, 145, 0.2)')};
  position: relative;
  transition: width ${({ collapsed }) => (collapsed ? '200ms' : '250ms')}
    cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
  overflow-y: auto;
`;
const NavTop = styled.div`
  flex: 1;
`;
const NavBottom = styled.div``;
const CondenseNavigationMenuItem = styled(NavigationMenuItem)`
  width: 3.5rem;
  & svg {
    transform: ${({ collapsed }) => (collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: 200ms;
  }
`;

const NavigationMenu = ({ collapsed, onToggleCollapse }) => {
  return (
    <NavWrap collapsed={collapsed}>
      <NavTop>
        <NavigationMenuItem icon="edit-3" label="Posts" active collapsed={collapsed} />
        <NavigationMenuItem icon="inbox" label="Post Categories" collapsed={collapsed} />
        <NavigationMenuItem icon="file-text" label="Pages" collapsed={collapsed} />
        <NavigationMenuItem icon="shopping-cart" label="Products" collapsed={collapsed} />
        <NavigationMenuItem icon="package" label="Product Categories" collapsed={collapsed} />
        <NavigationMenuItem icon="users" label="Authors" collapsed={collapsed} />
        <NavigationMenuItem icon="calendar" label="Events" collapsed={collapsed} />
        <NavigationMenuItem icon="image" label="Media" collapsed={collapsed} />
      </NavTop>
      <NavBottom>
        <NavigationMenuItem icon="bar-chart" label="Analytics" collapsed={collapsed} externalLink />
        <NavigationMenuItem
          icon="server"
          label="Product Categories"
          collapsed={collapsed}
          externalLink
        />
        <NavigationMenuItem
          icon="github"
          label="GitHub Repository"
          collapsed={collapsed}
          externalLink
        />
        <NavigationMenuItem icon="settings" label="Settings" collapsed={collapsed} />
        <CondenseNavigationMenuItem
          icon="chevron-right"
          collapsed={collapsed}
          onClick={onToggleCollapse}
        />
      </NavBottom>
    </NavWrap>
  );
};

export default NavigationMenu;
