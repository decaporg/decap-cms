import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { getCoords } from './getCoords';

/**
 * @type {{ callbacks: Map<Function, Function>; observer?: ResizeObserver; viewport?: DOMRect; raf?: number }}
 */
const viewportState = { callbacks: new Map() };

/** @type {ResizeObserverCallback} */
function onResize([entry]) {
  viewportState.viewport = entry.contentRect;
  if (viewportState.raf) cancelAnimationFrame(viewportState.raf);
  viewportState.raf = requestAnimationFrame(() => {
    viewportState.callbacks.forEach(cb => cb(viewportState.viewport));
  });
}

/**
 * Initializes a `ResizeObserver` to track viewport changes and notify subscribers.
 * We cache this single observer to avoid the overhead of creating a new one for every dropdown.
 */
function initObserver() {
  if (!viewportState.observer) {
    viewportState.observer = new ResizeObserver(onResize);
    viewportState.observer.observe(document.documentElement);
  }
}

/**
 * Registers a callback to be called with the viewport rect on changes.
 * @param {(viewport: DOMRect | undefined) => void} callback
 * @returns {() => void} An unsubscribe function to stop listening for viewport changes.
 */
function subscribeToViewportRect(callback) {
  initObserver();
  callback(viewportState.viewport);
  viewportState.callbacks.set(callback, callback);

  // Unsubscribe function that cleans up the callback and also the observer if no-one is listening anymore.
  return () => {
    viewportState.callbacks.delete(callback);
    if (viewportState.callbacks.size === 0 && viewportState.observer) {
      viewportState.observer.disconnect();
      delete viewportState.observer;
    }
  };
}

/** React hook providing the DOMRect of the viewport. */
function useViewportRect() {
  const [viewport, setViewport] = useState(/** @type {DOMRect | undefined} */ (undefined));
  useEffect(() => subscribeToViewportRect(setViewport), []);
  return viewport;
}

/**
 * Get co-ordinates for a dropdown based on its source element and the viewport.
 * @param {{ dropdownPosition?: import('./getCoords').Position; open?: boolean }} options
 *
 * @example
 * const [open, setOpen] = useState(false);
 * const { refs, coords } = useDropDownCoords({ dropdownPosition: 'right', open });
 *
 * return (
 *   <div style={{ position: 'relative' }}>
 *     // Pass the source ref to the button to attach to.
 *     <button ref={refs.source} onClick={() => setOpen(!open)}>
 *       Open Dropdown
 *     </button>
 *     <ul
 *       // Pass the dropdown ref to the dropdown menu to measure it.
 *       ref={refs.dropdown}
 *       style={{
 *         position: 'absolute',
 *         // Use the calculated co-ordinates to position the dropdown.
 *         left: coords.x,
 *         top: coords.y,
 *         display: open ? 'block' : 'none'
 *       }}>
 *       ...
 *     </ul>
 *   </div>
 * );
 */
export function useDropDownCoords({ dropdownPosition = 'left', open } = {}) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const viewport = useViewportRect();
  const source = useRef(/** @type {HTMLElement | null} */ (null));
  const dropdown = useRef(/** @type {HTMLElement | null} */ (null));

  useLayoutEffect(() => {
    if (!open || !viewport || !source.current || !dropdown.current) {
      return;
    }

    const { x, y } = getCoords({
      reference: source.current.getBoundingClientRect(),
      target: dropdown.current.getBoundingClientRect(),
      viewport,
      dropdownPosition,
    });

    setX(x);
    setY(y);
  }, [dropdownPosition, source.current, dropdown.current, viewport, open]);

  return { refs: { source, dropdown }, coords: { x, y } };
}
