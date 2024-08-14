import React from 'react';
import styled from '@emotion/styled';

const StyledInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const SwitchButton = styled.button`
  width: 2.25rem;
  height: 1.5rem;
  border-radius: 100px;
  position: relative;
  border: transparent;
  background-color: ${({ theme, checked }) =>
    checked ? theme.color.primary['900'] : theme.color.neutral[theme.darkMode ? '1000' : '300']};
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

function Switch({ checked, onCheckedChange, className }) {
  return (
    <>
      <StyledInput type={'checkbox'} checked={checked} />

      <SwitchButton
        className={className}
        checked={checked}
        onClick={() => onCheckedChange(!checked)}
      />
    </>
  );
}

export default Switch;
