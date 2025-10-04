import React from 'react';
import { useLinkToolbarButton, useLinkToolbarButtonState } from '@udecode/plate-link/react';
import { upsertLink, unwrapLink } from '@udecode/plate-link';
import { useEditorRef } from '@udecode/plate-common/react';

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
