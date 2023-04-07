function matchedAncestors(format, mode) {
  return {
    match: n =>
      n.type === format ||
      (format === 'paragraph' && `${n.type}`.startsWith('heading-')) ||
      (format === 'list' && `${n.type}`.endsWith('-list')),
    mode,
  };
}
export default matchedAncestors;
