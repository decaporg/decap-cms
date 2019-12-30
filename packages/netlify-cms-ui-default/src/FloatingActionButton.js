import React from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { colors, transitions } from './styles';

import Icon from './Icon';

const ActionButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 500;
`;
const FloatingButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 100%;
  background: ${colors.active};
  border: 0;
  color: #fff;
  transition: transform ${transitions.main};
  cursor: pointer;
  &.open {
    transform: rotate(45deg);
  }
`;

const StyledFabItem = styled.button`
  background: #ffffff;
  border-radius: 5px;
  color: ${colors.active};
  margin-bottom: 12px;
  padding: 8px 16px;
`;

const FloatingActionButton = ({ children, menuOpen, onClick }) => {
  return (
    <ActionButtonWrapper>
      {menuOpen && children}
      <FloatingButton onClick={onClick} className={menuOpen ? 'open' : 'closed'}>
        <Icon type="add" />
      </FloatingButton>
    </ActionButtonWrapper>
  );
};

FloatingActionButton.propTypes = {
  children: PropTypes.node,
  menuOpen: PropTypes.bool,
  onClick: PropTypes.func,
};

const FabItem = ({ label, action }) => {
  return <StyledFabItem onClick={action}>{label}</StyledFabItem>;
};

FabItem.propTypes = {
  label: PropTypes.string,
  action: PropTypes.func,
};

export { FloatingActionButton as default, FabItem, FloatingActionButton };
