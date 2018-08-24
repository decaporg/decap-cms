import React from 'react';
import styled from 'react-emotion';
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

const ListItemTopBar = ({ className, collapsed, onCollapseToggle, onRemove, dragHandleHOC }) => {
  const DragHandle = dragHandleHOC(() => (
    <DragIconContainer>
      <Icon type="drag-handle" size="small" />
    </DragIconContainer>
  ));

  return (
    <TopBar className={className}>
      {onCollapseToggle ? (
        <TopBarButton onClick={onCollapseToggle}>
          <Icon type="chevron" size="small" direction={collapsed ? 'right' : 'down'} />
        </TopBarButton>
      ) : null}
      {dragHandleHOC ? <DragHandle dragHandleHOC={dragHandleHOC} /> : null}
      {onRemove ? (
        <TopBarButton onClick={onRemove}>
          <Icon type="close" size="small" />
        </TopBarButton>
      ) : null}
    </TopBar>
  );
};

const StyledListItemTopBar = styled(ListItemTopBar)`
  display: flex;
  justify-content: space-between;
  height: 26px;
  border-radius: ${lengths.borderRadius} ${lengths.borderRadius} 0 0;
  position: relative;
`;

export default StyledListItemTopBar;
