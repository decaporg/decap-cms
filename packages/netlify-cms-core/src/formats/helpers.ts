export function sortKeys<Item extends unknown>(
  sortedKeys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selector: (a: Item) => string = (a: any) => a,
) {
  return (a: Item, b: Item) => {
    const idxA = sortedKeys.indexOf(selector(a));
    const idxB = sortedKeys.indexOf(selector(b));
    if (idxA === -1 || idxB === -1) return 0;
    if (idxA > idxB) return 1;
    if (idxA < idxB) return -1;
    return 0;
  };
}
