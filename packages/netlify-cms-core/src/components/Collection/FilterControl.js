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

const FilterControl = ({ fields }) => {
  return (
    <Dropdown
      renderButton={() => {
        return <FilterButton>Filter</FilterButton>;
      }}
      closeOnSelection={false}
      dropdownTopOverlap="30px"
      dropdownWidth="160px"
      dropdownPosition="left"
    >
      {fields.map(field => (
        <DropdownCheckedItem key={field.key} label={field.label} id={field.id} />
      ))}
    </Dropdown>
  );
};

export default translate()(FilterControl);
