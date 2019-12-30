import React from 'react';
import styled from '@emotion/styled';
import { colors } from './styles';

import Icon from './Icon';

const FloatingButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 100%;
  background: ${colors.active};
  border: 0;
  color: #fff;
`;

const FloatingActionButton = () => {
  return (
    <FloatingButton>
      <Icon type="add" />
    </FloatingButton>
  );
};

export default FloatingActionButton;
