/* eslint-disable react/prop-types */
import React from 'react';
import styled from '@emotion/styled';

const InsertionPoint = styled.div`
  height: 32px;
  cursor: text;
  position: relative;
  z-index: 1;
  margin-top: -16px;
`;

const VoidBlock = ({ editor, attributes, node, children }) => {
  const handleClick = event => {
    event.stopPropagation();
  };

  const previousSibling = editor.value.document.getPreviousSibling(node.key);
  const nextSibling = editor.value.document.getNextSibling(node.key);

  return (
    <div {...attributes} onClick={handleClick}>
      {!previousSibling && (
        <InsertionPoint onClick={() => {
          editor
            .insertNodeByKey(editor.value.document.key, 0, { type: 'paragraph', object: 'block' })
            .moveToStartOfDocument();
        }}/>
      )}
      {children}
      {(!nextSibling || editor.isVoid(nextSibling)) && (
        <InsertionPoint onClick={() => {
          editor
            .moveToEndOfNode(node)
            .insertBlock('paragraph')
            .focus();
        }}/>
      )}
    </div>
  );
};

export default VoidBlock;
