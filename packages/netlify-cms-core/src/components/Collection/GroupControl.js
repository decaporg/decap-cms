import React from 'react';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import {
  buttons,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  colors,
} from 'netlify-cms-ui-default';

const GroupButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.grayText};
  font-size: 14px;

  &:after {
    top: 11px;
  }
`;

const GroupControl = ({ viewGroups, t, onGroupClick, group }) => {
  const hasActiveGroup = group
    ?.valueSeq()
    .toJS()
    .some(f => f.active === true);

  return (
    <Dropdown
      renderButton={() => (
        <GroupButton
          css={css`
            color: ${hasActiveGroup ? colors.active : undefined};
          `}
        >
          {t('collection.collectionTop.groupBy')}
        </GroupButton>
      )}
      closeOnSelection={false}
      dropdownTopOverlap="30px"
      dropdownWidth="160px"
      dropdownPosition="left"
    >
      {viewGroups.map(viewGroup => {
        return (
          <DropdownItem
            key={viewGroup.id}
            label={viewGroup.label}
            onClick={() => onGroupClick(viewGroup)}
            isActive={group.getIn([viewGroup.id, 'active'], false)}
          />
        );
      })}
    </Dropdown>
  );
};

export default translate()(GroupControl);
