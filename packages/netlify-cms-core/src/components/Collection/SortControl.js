import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { buttons, Dropdown, DropdownItem, StyledDropdownButton } from 'netlify-cms-ui-default';
import { SortDirection } from '../../types/redux';

const SortButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.grayText};
  font-size: 14px;

  &:after {
    top: 11px;
  }
`;

function nextSortDirection(direction) {
  switch (direction) {
    case SortDirection.Ascending:
      return SortDirection.Descending;
    case SortDirection.Descending:
      return SortDirection.None;
    default:
      return SortDirection.Ascending;
  }
}

function sortIconProps(sortDir) {
  return {
    icon: 'chevron',
    iconDirection: sortIconDirections[sortDir],
    iconSmall: true,
  };
}

const sortIconDirections = {
  [SortDirection.Ascending]: 'up',
  [SortDirection.Descending]: 'down',
};

const SortControl = ({ t, fields, onSortClick, sort }) => {
  return (
    <Dropdown
      renderButton={() => <SortButton>{t('collection.collectionTop.sortBy')}</SortButton>}
      closeOnSelection={false}
      dropdownTopOverlap="30px"
      dropdownWidth="160px"
      dropdownPosition="left"
    >
      {fields.map(field => {
        const sortDir = sort?.getIn([field.key, 'direction']);
        const isActive = sortDir && sortDir !== SortDirection.None;
        const nextSortDir = nextSortDirection(sortDir);
        return (
          <DropdownItem
            key={field.key}
            label={field.label}
            onClick={() => onSortClick(field.key, nextSortDir)}
            isActive={isActive}
            {...(isActive && sortIconProps(sortDir))}
          />
        );
      })}
    </Dropdown>
  );
};

export default translate()(SortControl);
