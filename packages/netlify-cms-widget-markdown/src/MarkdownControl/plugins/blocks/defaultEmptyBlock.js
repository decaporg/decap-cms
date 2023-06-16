function defaultEmptyBlock(text = '') {
  return {
    type: 'paragraph',
    children: [{ text }],
  };
}

export default defaultEmptyBlock;
