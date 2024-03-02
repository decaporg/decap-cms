import React from 'react';
import styled from '@emotion/styled';
import { IconButton } from 'decap-cms-ui-next';

import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from '../../constants/collectionViews';

const ViewControlsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  max-width: 500px;
  gap: 4px;
`;

function ViewStyleControl({ viewStyle, onChangeViewStyle }) {
  return (
    <ViewControlsSection>
      <IconButton
        icon="menu"
        active={viewStyle === VIEW_STYLE_LIST}
        onClick={() => onChangeViewStyle(VIEW_STYLE_LIST)}
      />
      <IconButton
        icon="grid"
        active={viewStyle === VIEW_STYLE_GRID}
        onClick={() => onChangeViewStyle(VIEW_STYLE_GRID)}
      />
    </ViewControlsSection>
  );
}

export default ViewStyleControl;
