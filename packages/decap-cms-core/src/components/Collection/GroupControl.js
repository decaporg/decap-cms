import React, { useState } from 'react';
import { translate } from 'react-polyglot';
import { Menu, MenuItem } from 'decap-cms-ui-next';

import { ControlButton } from './ControlButton';

function GroupControl({ viewGroups, t, onGroupClick, group }) {
  const hasActiveGroup = group
    ?.valueSeq()
    .toJS()
    .some(f => f.active === true);

  const [groupMenuAnchorEl, setGroupMenuAnchorEl] = useState(null);

  return (
    <>
      <ControlButton active={hasActiveGroup} onClick={e => setGroupMenuAnchorEl(e.currentTarget)}>
        {t('collection.collectionTop.groupBy')}
      </ControlButton>

      <Menu
        anchorEl={groupMenuAnchorEl}
        open={!!groupMenuAnchorEl}
        onClose={() => setGroupMenuAnchorEl(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        {viewGroups.map(viewGroup => {
          return (
            <MenuItem
              key={viewGroup.id}
              onClick={() => onGroupClick(viewGroup)}
              selected={group.getIn([viewGroup.id, 'active'], false)}
            >
              {viewGroup.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

export default translate()(GroupControl);
