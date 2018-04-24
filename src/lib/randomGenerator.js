/*
 * Random number generator
 */

const padNumber = (num, base) => {
  const padLen = (32 / Math.sqrt(base));
  const str = num.toString(base);
  return (('0' * padLen) + str).slice(-padLen);
}

export function randomStr(len = 256) {
  const _rnds = new Uint32Array(Math.ceil(len / 32));
  window.crypto.getRandomValues(_rnds);

  const str = _rnds.reduce((agg, val) => (agg + padNumber(val, 16)), '');

  return str.slice(-len);
}