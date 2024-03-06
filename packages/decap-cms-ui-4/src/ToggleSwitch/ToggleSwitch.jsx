import React from 'react';
import styled from '@emotion/styled';

const ToggleSwitchInput = styled.div`
  width: 2.25rem;
  height: 1.5rem;
  border-radius: 100px;
  position: relative;
  background-color: ${({ theme, checked }) =>
    checked ? theme.color.success['900'] : theme.color.neutral[theme.darkMode ? '1000' : '300']};
  transition: 0.25s;
  cursor: pointer;
  &:after {
    content: '';
    display: block;
    position: absolute;
    left: ${props => (props.checked ? '0.875rem' : '0.125rem')};
    top: 0.125rem;
    border-radius: 50%;
    width: 1.25rem;
    height: 1.25rem;
    background-color: ${({ theme }) => theme.color.surface};
    box-shadow: 0 2px 6px 0 rgba(14, 30, 37, 0.2);
    transition: 0.25s;
  }
  &:hover {
    &:after {
      box-shadow: 0 4px 8px rgba(14, 30, 37, 0.25);
    }
  }
`;

const ToggleSwitch = ({ checked, onChange, className }) => (
  <ToggleSwitchInput className={className} checked={checked} onClick={() => onChange(!checked)} />
);

export default ToggleSwitch;
