import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import color from 'color';
import { IconButton, ButtonGroup } from 'decap-cms-ui-next';

import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from '../../constants/collectionViews';

const ViewControlsSection = styled(ButtonGroup)`
  ${({ theme }) => css`
    background-color: ${color(theme.color.neutral['700']).alpha(0.2).string()};
    border-radius: 8px;
    margin: initial;
  `}
`;

function ViewStyleControl({ viewStyle, onChangeViewStyle }) {
  return (
    <ViewControlsSection>
      <IconButton
        icon="menu"
        size="sm"
        active={viewStyle === VIEW_STYLE_LIST}
        onClick={() => onChangeViewStyle(VIEW_STYLE_LIST)}
      />
      <IconButton
        icon="grid"
        size="sm"
        active={viewStyle === VIEW_STYLE_GRID}
        onClick={() => onChangeViewStyle(VIEW_STYLE_GRID)}
      />
    </ViewControlsSection>
  );
}

export default ViewStyleControl;
