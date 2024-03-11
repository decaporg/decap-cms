import React, { useState } from 'react';
import { translate } from 'react-polyglot';
import { Menu, MenuItem } from 'decap-cms-ui-next';

import { ControlButton } from './ControlButton';

function FilterControl({ viewFilters, t, onFilterClick, filter }) {
  const hasActiveFilter = filter
    ?.valueSeq()
    .toJS()
    .some(f => f.active === true);

  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);

  return (
    <>
      <ControlButton active={hasActiveFilter} onClick={e => setFilterMenuAnchorEl(e.currentTarget)}>
        {t('collection.collectionTop.filterBy')}
      </ControlButton>

      <Menu
        anchorEl={filterMenuAnchorEl}
        open={!!filterMenuAnchorEl}
        onClose={() => setFilterMenuAnchorEl(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        {viewFilters.map(viewFilter => {
          return (
            <MenuItem
              key={viewFilter.id}
              onClick={() => onFilterClick(viewFilter)}
              selected={filter.getIn([viewFilter.id, 'active'], false)}
            >
              {viewFilter.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

export default translate()(FilterControl);
