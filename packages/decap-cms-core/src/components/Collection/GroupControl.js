import React from 'react';
import { translate } from 'react-polyglot';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownMenuItem } from 'decap-cms-ui-next';

import { ControlButton } from './ControlButton';

function GroupControl({ viewGroups, t, onGroupClick, group }) {
  const hasActiveGroup = group
    ?.valueSeq()
    .toJS()
    .some(f => f.active === true);

  return (
    <Dropdown>
      <DropdownTrigger>
        <ControlButton active={hasActiveGroup}>
          {t('collection.collectionTop.groupBy')}
        </ControlButton>
      </DropdownTrigger>

      <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
        {viewGroups.map(viewGroup => {
          return (
            <DropdownMenuItem
              key={viewGroup.id}
              onClick={() => onGroupClick(viewGroup)}
              selected={group.getIn([viewGroup.id, 'active'], false)}
            >
              {viewGroup.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}

export default translate()(GroupControl);
