import React from 'react';
import { useMarkToolbarButton, useMarkToolbarButtonState } from 'platejs/react';

import ToolbarButton from './ToolbarButton';

function MarkToolbarButton({ clear, nodeType, ...rest }) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const {
    props: { pressed, onClick },
  } = useMarkToolbarButton(state);
  return <ToolbarButton isActive={pressed} onClick={onClick} {...rest} />;
}

export default MarkToolbarButton;
