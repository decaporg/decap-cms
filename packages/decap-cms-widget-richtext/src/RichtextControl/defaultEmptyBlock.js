import { ParagraphPlugin } from 'platejs/react';

function defaultEmptyBlock(text = '') {
  return {
    type: ParagraphPlugin.key,
    children: [{ text }],
  };
}

export default defaultEmptyBlock;
