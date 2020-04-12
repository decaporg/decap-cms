import React from 'react';
import styled from '@emotion/styled';
import Tooltip from '../Tooltip';
import Icon from '../Icon';
import { ButtonGroup } from '../Button';
import color from 'color';
import { useUIContext } from '../hooks';

const NavMenuItemWrap = styled.a`
  width: 100%;
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 12px;
  cursor: pointer;
`;
export const ExternalLinkIcon = styled(Icon)`
  color: ${({ theme }) => theme.color.disabled};
`;
ExternalLinkIcon.defaultProps = { name: 'external-link', size: 'sm' };

const NavMenuItemInside = styled.span`
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  color: ${({ theme, active }) =>
    active ? theme.color.success['900'] : theme.color.mediumEmphasis};
  background-color: ${({ theme, active }) =>
    active
      ? color(theme.color.success['900'])
          .alpha(0.1)
          .string()
      : `transparent`};
  border: none;
  height: 2rem;
  border-radius: 6px;
  outline: none;
  transition: 200ms;
  ${NavMenuItemWrap}:hover & {
    color: ${({ theme, active }) =>
      active ? theme.color.success['900'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['900'])
            .alpha(0.1)
            .string()
        : color(theme.color.highEmphasis)
            .alpha(0.05)
            .string()};
    ${({ active }) =>
      active
        ? `
      cursor: default;
    `
        : ``}
  }
  ${NavMenuItemWrap}:active & {
    color: ${({ theme, active }) =>
      active ? theme.color.success['900'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['900'])
            .alpha(0.1)
            .string()
        : color(theme.color.highEmphasis)
            .alpha(0.1)
            .string()};
  }
  ${ButtonGroup} & {
    margin: 2px;
  }
  & svg {
    margin: 0.375rem;
  }
  & ${ExternalLinkIcon} {
    margin-right: 0.5rem;
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
  transition: opacity 200ms;
`;
export const NavItemContents = styled.span`
  display: flex;
  align-items: center;
  width: 100%;
`;

const NavMenuItem = ({ icon, children, className, href, active, onClick }) => {
  const { navCollapsed } = useUIContext();

  return (
    <Tooltip
      label={navCollapsed && children}
      anchorOrigin={{ y: 'center', x: 'right' }}
      transformOrigin={{ y: 'center', x: 'left' }}
      enterDelay={500}
      leaveDelay={250}
    >
      <NavMenuItemWrap
        className={className}
        onClick={onClick}
        href={href}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener noreferred' : undefined}
      >
        <NavMenuItemInside active={active}>
          <NavItemContents>
            <Icon name={icon} />
            <Label collapsed={navCollapsed}>{children}</Label>
            {href && <ExternalLinkIcon />}
          </NavItemContents>
        </NavMenuItemInside>
      </NavMenuItemWrap>
    </Tooltip>
  );
};

export default NavMenuItem;
