export function stringToRGB(str) {
  if (!str) return '000000';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00ffffff).toString(16).toUpperCase();

  return `00000${c}`.slice(-6);
}
