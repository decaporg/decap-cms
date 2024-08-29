import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import Icon from './Icon';
import { colors, lengths, buttons } from './styles';

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  height: 26px;
  border-radius: ${lengths.borderRadius} ${lengths.borderRadius} 0 0;
  position: relative;
`;

const TopBarButton = styled.button`
  ${buttons.button};
  color: ${colors.controlLabel};
  background: transparent;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  width: 32px;
  text-align: center;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TopBarButtonSpan = TopBarButton.withComponent('span');

const DragIconContainer = styled(TopBarButtonSpan)`
  width: 100%;
  cursor: move;
`;

function DragHandle({ Wrapper, id }) {
  return (
    <Wrapper id={id}>
      <DragIconContainer>
        <Icon type="drag-handle" size="small" />
      </DragIconContainer>
    </Wrapper>
  );
}

function ListItemTopBar(props) {
  const { className, collapsed, onCollapseToggle, onRemove, dragHandle, id } = props;
  return (
    <TopBar className={className}>
      {onCollapseToggle ? (
        <TopBarButton onClick={onCollapseToggle}>
          <Icon type="chevron" size="small" direction={collapsed ? 'right' : 'down'} />
        </TopBarButton>
      ) : null}
      {dragHandle ? <DragHandle Wrapper={dragHandle} id={id} /> : null}
      {onRemove ? (
        <TopBarButton onClick={onRemove}>
          <Icon type="close" size="small" />
        </TopBarButton>
      ) : null}
    </TopBar>
  );
}

ListItemTopBar.propTypes = {
  className: PropTypes.string,
  collapsed: PropTypes.bool,
  onCollapseToggle: PropTypes.func,
  onRemove: PropTypes.func,
};

const StyledListItemTopBar = styled(ListItemTopBar)`
  display: flex;
  justify-content: space-between;
  height: 26px;
  border-radius: ${lengths.borderRadius} ${lengths.borderRadius} 0 0;
  position: relative;
`;

export default StyledListItemTopBar;
