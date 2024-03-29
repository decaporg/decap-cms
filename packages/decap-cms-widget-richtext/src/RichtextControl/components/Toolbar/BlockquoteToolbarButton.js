import React from 'react';
import { useEditorRef, focusEditor, toggleNodeType } from '@udecode/plate-common';
import { unwrapList } from '@udecode/plate-list';
import { ELEMENT_BLOCKQUOTE } from '@udecode/plate-block-quote';

import ToolbarButton from './ToolbarButton';

function BlockquoteToolbarButton(props) {
  const editor = useEditorRef();

  function handleClick() {
    unwrapList(editor);
    toggleNodeType(editor, { activeType: ELEMENT_BLOCKQUOTE });
    focusEditor(editor);
  }
  const pressed = false;
  return <ToolbarButton isActive={pressed} onClick={handleClick} {...props} />;
}

export default BlockquoteToolbarButton;
