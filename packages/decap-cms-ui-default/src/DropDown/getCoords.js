/** @typedef {'left' | 'right' | 'center' | undefined} Position */

/**
 * Calculate relative co-ordinates for a dropdown to position it below a reference element.
 * @param {{ reference: DOMRect; target: DOMRect; viewport: DOMRect; dropdownPosition: Position }} options
 */
export function getCoords({ reference, target, dropdownPosition, viewport }) {
  let { x, y } = computeCoordsFromPlacement({ reference, target, dropdownPosition });
  ({ x, y } = constrain({ x, y, viewport, target }));
  return relativize({ x, y, reference });
}

/**
 * @param {{ reference: DOMRect; target: DOMRect; dropdownPosition: Position }} options
 * @returns {{ x: number; y: number }} co-ordinates
 */
function computeCoordsFromPlacement({ reference, target, dropdownPosition }) {
  const commonAlign = reference.width / 2 - target.width / 2;

  const coords = {
    x: reference.x + commonAlign,
    y: reference.y + reference.height,
  };

  switch (dropdownPosition) {
    case 'left':
      coords.x -= commonAlign;
      break;
    case 'right':
      coords.x += commonAlign;
      break;
    default:
  }

  return coords;
}

/**
 * Constrain co-ordinates within the viewport.
 * @param {{ x: number; y: number, viewport: DOMRect, target: DOMRect }} options
 */
function constrain({ x, y, viewport, target }) {
  const overflow = {
    left: x,
    right: x + target.width - viewport.width,
  };

  x = clamp(x - overflow.left, x, x - overflow.right);

  return { x, y };
}

/**
 * @param {number} min
 * @param {number} value
 * @param {number} max
 */
function clamp(min, value, max) {
  return Math.min(Math.max(min, value), max);
}

/**
 * Convert absolute viewport co-ordinates into element-relative co-ordinates.
 * @param {{ x: number; y: number; reference: DOMRect }} options
 */
function relativize({ x, y, reference }) {
  return { x: x - reference.x, y: y - reference.y };
}
