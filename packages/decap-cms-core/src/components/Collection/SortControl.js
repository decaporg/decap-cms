import React from 'react';
import { translate } from 'react-polyglot';
import styled from '@emotion/styled';
import color from 'color';
import { Icon, Dropdown, DropdownMenu, DropdownMenuItem } from 'decap-cms-ui-next';

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

const StyledDropdownMenuItem = styled(DropdownMenuItem)`
  ${({ active, theme }) =>
    active
      ? `
      background-color: ${color(theme.color.success['900']).alpha(0.2).string()};
      color: ${theme.color.success[theme.darkMode ? '300' : '1400']};
  `
      : ``}
`;

const StyledIcon = styled(Icon)`
  margin-left: 0.75rem;
  vertical-align: middle;

  transform: ${({ direction }) =>
    direction === SortDirection.Ascending ? 'rotate(-180deg)' : 'rotate(0deg)'};
  transition: transform 200ms;
`;

function SortControl({ t, fields, onSortClick, sort }) {
  const hasActiveSort = sort
    ?.valueSeq()
    .toJS()
    .some(s => s.direction !== SortDirection.None);

  return (
    <Dropdown>
      <ControlButton active={hasActiveSort}>{t('collection.collectionTop.sortBy')}</ControlButton>

      <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
        {fields.map(field => {
          const sortDir = sort?.getIn([field.key, 'direction']);
          const isActive = sortDir && sortDir !== SortDirection.None;
          const nextSortDir = nextSortDirection(sortDir);

          return (
            <StyledDropdownMenuItem
              key={field.key}
              onClick={() => onSortClick(field.key, nextSortDir)}
              active={isActive}
              endIcon={isActive && <StyledIcon name="chevron-down" direction={sortDir} />}
            >
              {field.label}
            </StyledDropdownMenuItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );

  // return (
  //   <Dropdown
  //     renderButton={() => {
  //       return (
  //         <ControlButton active={hasActiveSort} title={t('collection.collectionTop.sortBy')} />
  //       );
  //     }}
  //     closeOnSelection={false}
  //     dropdownTopOverlap="30px"
  //     dropdownWidth="160px"
  //     dropdownPosition="left"
  //   >
  //     {fields.map(field => {
  //       const sortDir = sort?.getIn([field.key, 'direction']);
  //       const isActive = sortDir && sortDir !== SortDirection.None;
  //       const nextSortDir = nextSortDirection(sortDir);
  //       return (
  //         <DropdownItem
  //           key={field.key}
  //           label={field.label}
  //           onClick={() => onSortClick(field.key, nextSortDir)}
  //           isActive={isActive}
  //           {...(isActive && sortIconProps(sortDir))}
  //         />
  //       );
  //     })}
  //   </Dropdown>
  // );
}

export default translate()(SortControl);
