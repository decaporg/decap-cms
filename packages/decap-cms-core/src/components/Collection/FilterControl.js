import React from 'react';
import { translate } from 'react-polyglot';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownMenuItem } from 'decap-cms-ui-next';

import { ControlButton } from './ControlButton';

function FilterControl({ viewFilters, t, onFilterClick, filter }) {
  const hasActiveFilter = filter
    ?.valueSeq()
    .toJS()
    .some(f => f.active === true);

  return (
    <Dropdown>
      <DropdownTrigger>
        <ControlButton active={hasActiveFilter}>
          {t('collection.collectionTop.filterBy')}
        </ControlButton>
      </DropdownTrigger>

      <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
        {viewFilters.map(viewFilter => {
          return (
            <DropdownMenuItem
              key={viewFilter.id}
              onClick={() => onFilterClick(viewFilter)}
              selected={filter.getIn([viewFilter.id, 'active'], false)}
            >
              {viewFilter.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}

export default translate()(FilterControl);
