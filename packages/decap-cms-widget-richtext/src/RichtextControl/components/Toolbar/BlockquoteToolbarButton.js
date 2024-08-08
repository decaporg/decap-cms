import React from 'react';
import {
  useEditorRef,
  focusEditor,
  useEditorSelector,
  findNode,
} from '@udecode/plate-common';
import { unwrapList } from '@udecode/plate-list';
import { toggleWrapNodes } from '@udecode/slate-utils';
import { ELEMENT_BLOCKQUOTE } from '@udecode/plate-block-quote';

import ToolbarButton from './ToolbarButton';

function BlockquoteToolbarButton(props) {
  const editor = useEditorRef();

  const pressed = useEditorSelector(editor => !!findNode(editor, { match: { type: ELEMENT_BLOCKQUOTE } }), []);

  function handleClick() {
    unwrapList(editor);
    toggleWrapNodes(editor, ELEMENT_BLOCKQUOTE);
    focusEditor(editor);
  }

  return <ToolbarButton isActive={pressed} onClick={handleClick} {...props} />;
}

export default BlockquoteToolbarButton;
