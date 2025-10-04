import React from 'react';
import { useListToolbarButton, useListToolbarButtonState } from '@udecode/plate-list/react';

import ToolbarButton from './ToolbarButton';

function ListToolbarButton({ label, icon, type, disabled }) {
  const state = useListToolbarButtonState({ nodeType: type });

  const {
    props: { pressed, onClick },
  } = useListToolbarButton(state);

  return (
    <ToolbarButton
      label={label}
      icon={icon}
      onClick={onClick}
      isActive={pressed}
      disabled={disabled}
    />
  );
}

export default ListToolbarButton;
