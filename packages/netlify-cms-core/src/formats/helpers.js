export const sortKeys = (sortedKeys = []) => (a, b) => {
  const idxA = sortedKeys.indexOf(a);
  const idxB = sortedKeys.indexOf(b);
  if (idxA === -1 || idxB === -1) return 0;
  if (idxA > idxB) return 1;
  if (idxA < idxB) return -1;
  return 0;
};
