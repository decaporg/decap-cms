import React from 'react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { BlockquotePlugin } from '@platejs/basic-nodes/react';
import { unwrapList } from '@platejs/list-classic';

import ToolbarButton from './ToolbarButton';

function BlockquoteToolbarButton(props) {
  const editor = useEditorRef();

  const pressed = useEditorSelector(
    editor => !!editor.api.node({ match: { type: BlockquotePlugin.key } }),
    [],
  );

  function handleClick() {
    unwrapList(editor);
    editor.tf.toggleBlock(BlockquotePlugin.key, { wrap: true });
    editor.tf.focus();
  }

  return <ToolbarButton isActive={pressed} onClick={handleClick} {...props} />;
}

export default BlockquoteToolbarButton;
