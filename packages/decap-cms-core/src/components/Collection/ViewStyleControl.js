import React from 'react';
import styled from '@emotion/styled';
import { Icon, buttons, colors } from 'decap-cms-ui-default';

import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from '../../constants/collectionViews';

const ViewControlsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  max-width: 500px;
`;

const ViewControlsButton = styled.button`
  ${buttons.button};
  color: ${props => (props.isActive ? colors.active : '#b3b9c4')};
  background-color: transparent;
  display: block;
  padding: 0;
  margin: 0 4px;

  &:last-child {
    margin-right: 0;
  }

  ${Icon} {
    display: block;
  }
`;

function ViewStyleControl({ viewStyle, onChangeViewStyle }) {
  return (
    <ViewControlsSection>
      <ViewControlsButton
        isActive={viewStyle === VIEW_STYLE_LIST}
        onClick={() => onChangeViewStyle(VIEW_STYLE_LIST)}
      >
        <Icon type="list" />
      </ViewControlsButton>
      <ViewControlsButton
        isActive={viewStyle === VIEW_STYLE_GRID}
        onClick={() => onChangeViewStyle(VIEW_STYLE_GRID)}
      >
        <Icon type="grid" />
      </ViewControlsButton>
    </ViewControlsSection>
  );
}

export default ViewStyleControl;
