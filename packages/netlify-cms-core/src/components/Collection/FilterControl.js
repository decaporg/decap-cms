import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import {
  buttons,
  Dropdown,
  DropdownCheckedItem,
  StyledDropdownButton,
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

const FilterControl = ({ viewFilters, t, onFilterClick, filter }) => {
  return (
    <Dropdown
      renderButton={() => {
        return <FilterButton>{t('collection.collectionTop.filter')}</FilterButton>;
      }}
      closeOnSelection={false}
      dropdownTopOverlap="30px"
      dropdownPosition="left"
    >
      {viewFilters.map(viewFilter => {
        return (
          <DropdownCheckedItem
            key={viewFilter.field}
            label={viewFilter.label}
            id={viewFilter.field}
            checked={filter.get(viewFilter.field, false)}
            onClick={() => onFilterClick(viewFilter.field)}
          />
        );
      })}
    </Dropdown>
  );
};

export default translate()(FilterControl);
