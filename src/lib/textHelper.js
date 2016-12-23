export function truncateMiddle(string = "", size) {
  if (string.length <= size) {
    return string;
  }
  return `${ string.substring(0, size / 2) }\u2026${ string.substring(string.length - size / 2 + 1, string.length) }`;
}

export function stringToRGB(str) {
  if (!str) return "000000";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

  return "00000".substring(0, 6 - c.length) + c;
}
