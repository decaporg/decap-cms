import React from 'react';
import { translate } from 'react-polyglot';
import { Dropdown, DropdownItem } from 'decap-cms-ui-default';

import { SortDirection } from '../../types/redux';
import { ControlButton } from './ControlButton';

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

function SortControl({ t, fields, onSortClick, sort }) {
  const hasActiveSort = sort
    ?.valueSeq()
    .toJS()
    .some(s => s.direction !== SortDirection.None);

  return (
    <Dropdown
      renderButton={() => {
        return (
          <ControlButton active={hasActiveSort} title={t('collection.collectionTop.sortBy')} />
        );
      }}
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
}

export default translate()(SortControl);
