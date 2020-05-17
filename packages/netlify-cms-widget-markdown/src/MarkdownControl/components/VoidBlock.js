/* eslint-disable react/prop-types */
import React from 'react';
import { css } from '@emotion/core';
import { zIndex } from 'netlify-cms-ui-legacy';

const InsertionPoint = props => (
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

const VoidBlock = ({ editor, attributes, node, children }) => {
  const handleClick = event => {
    event.stopPropagation();
  };

  return (
    <div {...attributes} onClick={handleClick}>
      {!editor.canInsertBeforeNode(node) && (
        <InsertionPoint onClick={() => editor.forceInsertBeforeNode(node)} />
      )}
      {children}
      {!editor.canInsertAfterNode(node) && (
        <InsertionPoint onClick={() => editor.forceInsertAfterNode(node)} />
      )}
    </div>
  );
};

export default VoidBlock;
