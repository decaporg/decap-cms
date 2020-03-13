import React from 'react';
import styled from '@emotion/styled';
import Tooltip from '../Tooltip';
import Icon from '../Icon';
import { ButtonGroup } from '../Button';
import color from 'color';

const NavigationMenuItemWrap = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 12px;
  cursor: pointer;
`;
const NavigationMenuItemInside = styled.a`
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  color: ${({ theme, active }) =>
    active ? theme.color.success['500'] : theme.color.mediumEmphasis};
  background-color: ${({ theme, active }) =>
    active
      ? color(theme.color.success['500'])
          .alpha(0.1)
          .string()
      : `transparent`};
  border: none;
  height: 2rem;
  border-radius: 6px;
  outline: none;
  transition: 200ms;
  ${NavigationMenuItemWrap}:hover & {
    color: ${({ theme, active }) =>
      active ? theme.color.success['500'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['500'])
            .alpha(0.2)
            .string()
        : color(theme.color.highEmphasis)
            .alpha(0.05)
            .string()};
  }
  ${NavigationMenuItemWrap}:active & {
    color: ${({ theme, active }) =>
      active ? theme.color.success['500'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['500'])
            .alpha(0.3)
            .string()
        : color(theme.color.highEmphasis)
            .alpha(0.1)
            .string()};
  }
  ${ButtonGroup} & {
    margin: 2px;
  }
  & svg {
    margin: 0.4375rem;
  }
`;
const Label = styled.span`
  margin-left: 0.75rem;
  display: flex;
  flex: 1;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: ${({ collapsed }) => (collapsed ? '0' : '1')};
  transition: 200ms;
`;

const NavItemContents = styled.span`
  display: flex;
  width: 13.5rem;
  min-width: 13.5rem;
  align-items: center;
`;

const NavigationMenuItem = ({ icon, label, collapsed, href, active, onClick }) => {
  return (
    <Tooltip
      label={collapsed && label}
      anchorOrigin={{ y: 'center', x: 'right' }}
      transformOrigin={{ y: 'center', x: 'left' }}
      enterDelay={500}
      leaveDelay={250}
    >
      <NavigationMenuItemWrap>
        <NavigationMenuItemInside
          active={active}
          onClick={onClick}
          href={href}
          target={href ? '_blank' : undefined}
          rel={href ? 'noopener noreferred' : undefined}>
          <NavItemContents>
            <Icon name={icon} />
            <Label collapsed={collapsed}>{label}</Label>
          </NavItemContents>
        </NavigationMenuItemInside>
      </NavigationMenuItemWrap>
    </Tooltip>
  );
}

export default NavigationMenuItem;
