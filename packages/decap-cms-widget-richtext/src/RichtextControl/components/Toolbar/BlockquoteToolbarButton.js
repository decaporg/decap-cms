import React from 'react';
import { findNode } from '@udecode/plate-common';
import { useEditorRef, focusEditor, useEditorSelector } from '@udecode/plate-common/react';
import { unwrapList } from '@udecode/plate-list';
import { toggleWrapNodes } from '@udecode/slate-utils';
import { BlockquotePlugin } from '@udecode/plate-block-quote/react';


import ToolbarButton from './ToolbarButton';

function BlockquoteToolbarButton(props) {
  const editor = useEditorRef();

  const pressed = useEditorSelector(
    editor => !!findNode(editor, { match: { type: BlockquotePlugin.key } }),
    [],
  );

  function handleClick() {
    unwrapList(editor);
    toggleWrapNodes(editor, BlockquotePlugin.key);
    focusEditor(editor);
  }

  return <ToolbarButton isActive={pressed} onClick={handleClick} {...props} />;
}

export default BlockquoteToolbarButton;
