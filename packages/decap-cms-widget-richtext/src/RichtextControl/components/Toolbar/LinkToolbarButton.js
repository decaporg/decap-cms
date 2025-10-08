import React from 'react';
import { useEditorRef } from 'platejs/react';
import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react';
import { unwrapLink, upsertLink } from '@platejs/link';

import ToolbarButton from './ToolbarButton';

function LinkToolbarButton({ t, ...rest }) {
  const state = useLinkToolbarButtonState();
  const {
    props: { pressed },
  } = useLinkToolbarButton(state);

  const editor = useEditorRef();

  function handleClick() {
    const url = window.prompt(t('editor.editorWidgets.markdown.linkPrompt'), '');

    if (url) {
      upsertLink(editor, { url, skipValidation: true });
    } else if (url == '') {
      unwrapLink(editor);
    }
  }

  return <ToolbarButton isActive={pressed} onClick={handleClick} {...rest} />;
}

export default LinkToolbarButton;
