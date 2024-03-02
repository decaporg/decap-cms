import React, { useState } from 'react';
import { translate } from 'react-polyglot';
import styled from '@emotion/styled';
import color from 'color';
import { Button, Icon, Menu, MenuItem } from 'decap-cms-ui-next';

import { SortDirection } from '../../types/redux';

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

const StyledMenuItem = styled(MenuItem)`
  ${({ isActive, theme }) =>
    isActive
      ? `
      background-color: ${color(theme.color.success['900']).alpha(0.2).string()};
      color: ${theme.color.success[theme.darkMode ? '300' : '1400']};
  `
      : ``}
`;

const StyledIcon = styled(Icon)`
  margin-left: 0.75rem;
  vertical-align: middle;

  ${({ direction }) =>
    direction === SortDirection.Ascending
      ? `
      rotate: 180deg;
    `
      : ``}
`;

const TextWrap = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function SortControl({ t, fields, onSortClick, sort }) {
  const hasActiveSort = sort
    ?.valueSeq()
    .toJS()
    .some(s => s.direction !== SortDirection.None);

  const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState(null);

  return (
    <>
      <Button
        // type={hasActiveSort ? 'success' : 'default'}
        onClick={e => setSortMenuAnchorEl(e.currentTarget)}
        hasMenu
      >
        {t('collection.collectionTop.sortBy')}
      </Button>

      <Menu
        anchorEl={sortMenuAnchorEl}
        open={!!sortMenuAnchorEl}
        onClose={() => setSortMenuAnchorEl(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        {fields.map(field => {
          const sortDir = sort?.getIn([field.key, 'direction']);
          const isActive = sortDir && sortDir !== SortDirection.None;
          const nextSortDir = nextSortDirection(sortDir);

          return (
            <StyledMenuItem
              key={field.key}
              onClick={() => onSortClick(field.key, nextSortDir)}
              isActive={isActive}
            >
              <TextWrap>
                {field.label}

                {isActive && <StyledIcon name="chevron-down" direction={sortDir} />}
              </TextWrap>
            </StyledMenuItem>
          );
        })}
      </Menu>
    </>
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
