import React from 'react';
import { translate } from 'react-polyglot';
import { Dropdown, DropdownCheckedItem } from 'netlify-cms-ui-default';

import { ControlButton } from './ControlButton';

function FilterControl({ viewFilters, t, onFilterClick, filter }) {
  const hasActiveFilter = filter
    ?.valueSeq()
    .toJS()
    .some(f => f.active === true);

  return (
    <Dropdown
      renderButton={() => {
        return (
          <ControlButton active={hasActiveFilter} title={t('collection.collectionTop.filterBy')} />
        );
      }}
      closeOnSelection={false}
      dropdownTopOverlap="30px"
      dropdownPosition="left"
    >
      {viewFilters.map(viewFilter => {
        return (
          <DropdownCheckedItem
            key={viewFilter.id}
            label={viewFilter.label}
            id={viewFilter.id}
            checked={filter.getIn([viewFilter.id, 'active'], false)}
            onClick={() => onFilterClick(viewFilter)}
          />
        );
      })}
    </Dropdown>
  );
}

export default translate()(FilterControl);
