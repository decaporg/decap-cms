export function stringToRGB(str) {
  if (!str) return '000000';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00ffffff).toString(16).toUpperCase();

  // eslint-disable-next-line unicorn/prefer-string-slice
  return '00000'.substring(0, 6 - c.length) + c;
}
