import React from 'react';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import {
  buttons,
  Dropdown,
  DropdownRadioItem,
  StyledDropdownButton,
  colors,
} from 'netlify-cms-ui-default';

const FilterButton = styled(StyledDropdownButton)`
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
      renderButton={() => {
        return (
          <FilterButton
            css={css`
              color: ${hasActiveGroup ? colors.active : undefined};
            `}
          >
            {t('collection.collectionTop.groupBy')}
          </FilterButton>
        );
      }}
      closeOnSelection={false}
      dropdownTopOverlap="30px"
      dropdownPosition="left"
    >
      {viewGroups.map(viewGroup => {
        return (
          <DropdownRadioItem
            key={viewGroup.id}
            label={viewGroup.label}
            id={viewGroup.id}
            checked={group.getIn([viewGroup.id, 'active'], false)}
            onClick={() => onGroupClick(viewGroup)}
          />
        );
      })}
    </Dropdown>
  );
};

export default translate()(GroupControl);
