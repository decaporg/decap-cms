/* eslint-disable react/prop-types */
import React from 'react';
import { css } from '@emotion/react';
import { zIndex } from 'decap-cms-ui-default';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms } from 'slate';

import defaultEmptyBlock from '../plugins/blocks/defaultEmptyBlock';

function InsertionPoint(props) {
  return (
    <div
      css={css`
        height: 32px;
        cursor: text;
        position: relative;
        z-index: ${zIndex.zIndex1};
        margin-top: -16px;
      `}
      {...props}
    />
  );
}

function VoidBlock({ attributes, children, element }) {
  const editor = useSlate();
  const path = ReactEditor.findPath(editor, element);

  function insertAtPath(at) {
    Transforms.insertNodes(editor, defaultEmptyBlock(), { select: true, at });
  }

  function handleClick(event) {
    event.stopPropagation();
  }

  function handleInsertBefore() {
    insertAtPath(path);
  }

  function handleInsertAfter() {
    insertAtPath([...path.slice(0, -1), path[path.length - 1] + 1]);
  }

  const insertBefore = path[0] === 0;
  const nextElement = editor.children[path[0] + 1];
  const insertAfter = path[0] === editor.children.length - 1 || editor.isVoid(nextElement);

  return (
    <div {...attributes} onClick={handleClick} contentEditable={false}>
      {insertBefore && <InsertionPoint onClick={handleInsertBefore} />}
      {children}
      {insertAfter && <InsertionPoint onClick={handleInsertAfter} />}
    </div>
  );
}

export default VoidBlock;
