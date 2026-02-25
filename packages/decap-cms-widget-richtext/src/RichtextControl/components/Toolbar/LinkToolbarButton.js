import React from 'react';
import { useEditorRef } from 'platejs/react';
import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react';

import ToolbarButton from './ToolbarButton';
import { handleLinkClick } from '../../linkHandler';

function LinkToolbarButton({ t, ...rest }) {
  const state = useLinkToolbarButtonState();
  const {
    props: { pressed },
  } = useLinkToolbarButton(state);

  const editor = useEditorRef();

  function handleClick() {
    handleLinkClick({ editor, t });
  }

  return <ToolbarButton isActive={pressed} onClick={handleClick} {...rest} />;
}

export default LinkToolbarButton;
