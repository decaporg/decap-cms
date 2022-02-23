import React from 'react';
import { translate } from 'react-polyglot';
import { Dropdown, DropdownItem } from 'netlify-cms-ui-default';

import { ControlButton } from './ControlButton';

function GroupControl({ viewGroups, t, onGroupClick, group }) {
  const hasActiveGroup = group
    ?.valueSeq()
    .toJS()
    .some(f => f.active === true);

  return (
    <Dropdown
      renderButton={() => {
        return (
          <ControlButton active={hasActiveGroup} title={t('collection.collectionTop.groupBy')} />
        );
      }}
      closeOnSelection={false}
      dropdownTopOverlap="30px"
      dropdownWidth="160px"
      dropdownPosition="left"
    >
      {viewGroups.map(viewGroup => {
        return (
          <DropdownItem
            key={viewGroup.id}
            label={viewGroup.label}
            onClick={() => onGroupClick(viewGroup)}
            isActive={group.getIn([viewGroup.id, 'active'], false)}
          />
        );
      })}
    </Dropdown>
  );
}

export default translate()(GroupControl);
