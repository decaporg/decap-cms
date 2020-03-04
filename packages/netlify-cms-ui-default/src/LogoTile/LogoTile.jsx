import React from 'react';
import styled from '@emotion/styled';
import Logo from '../Logo';

const LogoWrap = styled.div`
  background: ${({ theme }) =>
    theme.darkMode
      ? 'linear-gradient(135deg, #35ADB1 0%, #4C9ABE 100%)'
      : theme.color.neutral['1400']};
  width: 3.5rem;
  min-width: 3.5rem;
  height: 3.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 1rem;
`;

const LogoTile = () => (
  <LogoWrap>
    <Logo />
  </LogoWrap>
);

export default LogoTile;
