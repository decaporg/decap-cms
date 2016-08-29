/*
 * Random number generator
 */

let rng;

if (window.crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  const _rnds32 = new Uint32Array(1);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds32);
    return _rnds32[0];
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  // If no Crypto available, use Math.random().
  rng = function() {
    const r = Math.random() * 0x100000000;
    const _rnds = r >>> 0;
    return _rnds;
  };
}

export function randomStr() {
  return rng().toString(36);
}

export default rng;
