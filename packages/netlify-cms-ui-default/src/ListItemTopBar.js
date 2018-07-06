import React from 'react';
import styled from 'react-emotion';
import Icon from './Icon';
import { colors, lengths } from './styles';

const TopBarButton = styled.button`
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
`

const TopBarButtonSpan = TopBarButton.withComponent('span');

const DragIcon = styled(TopBarButtonSpan)`
  width: 100%;
  cursor: move;
`

const ListItemTopBar = ({ collapsed, onCollapseToggle, onRemove, dragHandleHOC }) => (
  <div>
    {
      onCollapseToggle
        ? <TopBarButton onClick={onCollapseToggle}>
            <Icon type="chevron" size="small" direction={collapsed ? 'right' : 'down'}/>
          </TopBarButton>
        : null
    }
    {
      dragHandleHOC
        ? <DragIcon>
            <Icon type="drag-handle" size="small"/>
          </DragIcon>
        : null
    }
    {
      onRemove
        ? <TopBarButton onClick={onRemove}>
            <Icon type="close" size="small"/>
          </TopBarButton>
        : null
    }
  </div>
);

const StyledListItemTopBar = styled(ListItemTopBar)`
  display: flex;
  justify-content: space-between;
  height: 26px;
  border-radius: ${lengths.borderRadius} ${lengths.borderRadius} 0 0;
  position: relative;
`

export default StyledListItemTopBar;
